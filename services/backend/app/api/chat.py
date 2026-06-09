from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends
from langchain_core.messages import BaseMessage

from app.api.chat_service import (
    extract_and_persist,
    extract_tool_invocations,
    get_or_create_session,
    to_langchain_messages,
)
from app.api.deps import get_agent
from app.api.schemas import ChatMessage, ChatRequest, ChatResponse
from app.auth import current_user_id
from app.config import settings
from app.sessions.store import get_store

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    background: BackgroundTasks,
    agent: Annotated[object, Depends(get_agent)],
    user_id: str = Depends(current_user_id),
) -> ChatResponse:
    session = get_or_create_session(req.session_id, user_id)

    result = await agent.ainvoke({"messages": to_langchain_messages(req.messages)})
    messages: list[BaseMessage] = result["messages"]

    tool_calls = extract_tool_invocations(messages)
    assistant_msg = ChatMessage(
        role="assistant",
        content=str(messages[-1].content),
        tool_calls=tool_calls or None,
    )

    # Persist new user message + assistant reply (with tool_calls) to the session.
    get_store().append(session["id"], [req.messages[-1], assistant_msg])
    background.add_task(extract_and_persist, user_id, session["id"])

    return ChatResponse(
        session_id=session["id"],
        message=assistant_msg,
        tool_calls=tool_calls,
        model=settings.ollama_chat_model,
    )
