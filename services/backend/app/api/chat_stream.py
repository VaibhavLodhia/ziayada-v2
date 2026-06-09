"""SSE streaming chat endpoint.

Event stream format (one event per `data: <json>\\n\\n` block):
  {"type": "session",     "session_id": "..."}                — first event
  {"type": "token",       "delta": "..."}                      — assistant token chunks
  {"type": "tool",        "id": "...", "name": "...", "args": {...}}  — tool starts
  {"type": "tool_result", "id": "...", "name": "...", "result": "..."} — tool finishes
  {"type": "error",       "message": "..."}                    — fatal stream error
  {"type": "done"}                                             — terminal event

Background entity-extraction kicks off after stream completes.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessageChunk
from pydantic import BaseModel

from app.api.chat_service import extract_and_persist, get_or_create_session, to_langchain_messages
from app.api.deps import get_agent
from app.api.schemas import ChatMessage, ChatRequest, ToolInvocation
from app.api.stream_events import (
    DoneEvent,
    ErrorEvent,
    SessionEvent,
    TokenEvent,
    ToolEvent,
    ToolResultEvent,
)
from app.auth import current_user_id
from app.sessions.store import get_store

router = APIRouter(prefix="/api", tags=["chat"])
log = logging.getLogger(__name__)


def _sse(event: BaseModel) -> str:
    # model_dump_json() is compact (no spaces) — byte-identical to the previous
    # json.dumps(payload, separators=(',', ':')) output, so the wire is unchanged.
    return f"data: {event.model_dump_json()}\n\n"


async def _event_stream(
    req: ChatRequest,
    agent: object,
    session_id: str,
) -> AsyncGenerator[str, None]:
    yield _sse(SessionEvent(type="session", session_id=session_id))

    text_parts: list[str] = []
    tool_calls: dict[str, ToolInvocation] = {}
    errored = False

    try:
        async for event in agent.astream_events(  # type: ignore[attr-defined]
            {"messages": to_langchain_messages(req.messages)},
            version="v2",
        ):
            etype = event.get("event")
            if etype == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if isinstance(chunk, AIMessageChunk) and chunk.content:
                    text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
                    text_parts.append(text)
                    yield _sse(TokenEvent(type="token", delta=text))
            elif etype == "on_tool_start":
                run_id = str(event.get("run_id", ""))
                name = event.get("name", "")
                args = event.get("data", {}).get("input", {})
                tool_calls[run_id] = ToolInvocation(name=name, args=args)
                yield _sse(ToolEvent(type="tool", id=run_id, name=name, args=args))
            elif etype == "on_tool_end":
                run_id = str(event.get("run_id", ""))
                output = event.get("data", {}).get("output", "")
                result = str(output)
                if run_id in tool_calls:
                    tool_calls[run_id].result = result
                yield _sse(
                    ToolResultEvent(
                        type="tool_result",
                        id=run_id,
                        name=event.get("name", ""),
                        result=result,
                    )
                )
    except Exception as e:
        errored = True
        log.exception("stream error: %s", e)
        yield _sse(ErrorEvent(type="error", message=str(e)))

    if not errored:
        final_text = "".join(text_parts).strip()
        if final_text or tool_calls:
            assistant_msg = ChatMessage(
                role="assistant",
                content=final_text,
                tool_calls=list(tool_calls.values()) or None,
            )
            get_store().append(session_id, [req.messages[-1], assistant_msg])

    yield _sse(DoneEvent(type="done"))


@router.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    background: BackgroundTasks,
    agent: Annotated[object, Depends(get_agent)],
    user_id: str = Depends(current_user_id),
) -> StreamingResponse:
    session = get_or_create_session(req.session_id, user_id)
    background.add_task(extract_and_persist, user_id, session["id"])

    return StreamingResponse(
        _event_stream(req, agent, session["id"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
