"""Shared chat helpers used by both /api/chat and /api/chat/stream.

Keeps the routers thin and avoids cross-router private-imports.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage

from app.api.schemas import ChatMessage, ToolInvocation
from app.extract.entities import extract_from_messages
from app.extract.persist import persist_graph
from app.sessions.store import get_store

log = logging.getLogger(__name__)


def to_langchain_messages(messages: list[ChatMessage]) -> list[BaseMessage]:
    mapping = {"user": HumanMessage, "assistant": AIMessage, "system": SystemMessage}
    return [mapping[m.role](content=m.content) for m in messages]


def extract_tool_invocations(messages: list[BaseMessage]) -> list[ToolInvocation]:
    """Pair each AIMessage tool_call with its ToolMessage result (matched by id)."""
    calls_by_id: dict[str, ToolInvocation] = {}
    for m in messages:
        if isinstance(m, AIMessage):
            for call in getattr(m, "tool_calls", []) or []:
                calls_by_id[call["id"]] = ToolInvocation(
                    name=call["name"], args=call.get("args", {})
                )
        elif isinstance(m, ToolMessage) and m.tool_call_id in calls_by_id:
            calls_by_id[m.tool_call_id].result = str(m.content)
    return list(calls_by_id.values())


def get_or_create_session(session_id: str | None, user_id: str) -> dict[str, Any]:
    """Load an existing session by id, or create a new one for the given user."""
    store = get_store()
    if session_id:
        existing = store.load(session_id)
        if existing is not None:
            return existing
    return store.create(user_id)


async def extract_and_persist(user_id: str, session_id: str) -> None:
    """Background task: re-extract entities from the full session, write to graph."""
    session = get_store().load(session_id)
    if not session:
        return
    try:
        graph = await extract_from_messages(session["messages"])
        await persist_graph(user_id, graph, session_id=session_id)
    except Exception as e:
        log.warning("background extraction failed for session=%s: %s", session_id, e)
