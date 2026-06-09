"""User self-service endpoints: reset + seed the current user's graph."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.schemas import ChatMessage
from app.auth import current_user_id
from app.db.graph import run_cypher
from app.extract.entities import extract_from_messages
from app.extract.persist import persist_graph
from app.seed.demo_sessions import DEMO_SESSIONS
from app.sessions.store import get_store

router = APIRouter(prefix="/api/me", tags=["me"])
log = logging.getLogger(__name__)


class SeedResult(BaseModel):
    sessions_seeded: int
    entities_written: int


async def _clear_graph_for(user_id: str) -> None:
    """Wipe the user's TOUCHED subgraph + their on-disk sessions. Shared by both endpoints."""
    await run_cypher(
        "MATCH (u:User {id: $uid})-[t:TOUCHED]->(e:Entity) DETACH DELETE e",
        params={"uid": user_id},
    )
    await run_cypher(
        "MATCH (u:User {id: $uid}) DETACH DELETE u", params={"uid": user_id}
    )
    store = get_store()
    for s_path in store.root.glob("*.json"):
        try:
            import json

            sess = json.loads(s_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if sess.get("user_id") != user_id:
            continue
        try:
            s_path.unlink()
        except OSError:
            pass


@router.delete("/graph")
async def clear_my_graph(user_id: str = Depends(current_user_id)) -> dict[str, str]:
    """Wipe the current user's TOUCHED subgraph + their stored sessions."""
    await _clear_graph_for(user_id)
    return {"status": "cleared"}


@router.post("/seed-demo", response_model=SeedResult)
async def seed_demo(user_id: str = Depends(current_user_id)) -> SeedResult:
    """Wipe then re-populate from the canned conversations.

    Each demo conversation becomes a real on-disk session, so the per-session
    filter on /graph has real sessions to choose from.
    """
    await _clear_graph_for(user_id)
    store = get_store()
    total = 0
    for messages in DEMO_SESSIONS:
        session = store.create(user_id)
        store.append(session["id"], [ChatMessage(**m) for m in messages])
        graph = await extract_from_messages(messages)
        total += await persist_graph(user_id, graph, session_id=session["id"])
    return SeedResult(sessions_seeded=len(DEMO_SESSIONS), entities_written=total)
