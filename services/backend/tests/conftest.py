"""Shared pytest fixtures. Tests use a REAL Apache AGE graph (running inside
Postgres) and a REAL filesystem — no mocks.

Graph tests skip automatically if Postgres/AGE is unreachable (useful for CI
environments that don't bring up the docker-compose stack).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import pytest
import pytest_asyncio

from app.config import settings
from app.db.graph import close_pool, ensure_graph, run_cypher, wait_until_ready
from app.sessions.store import SessionStore

# Stable test user id — auth requires a real DB-backed user, but the graph /
# session-store tests don't care about identity, only that the same id is used
# for setup, exercise, and teardown.
TEST_USER_ID = "demo-user"


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def graph_ready() -> AsyncIterator[None]:
    """Ensure Postgres/AGE is reachable and the graph exists; else skip."""
    if not await wait_until_ready(timeout_s=5.0):
        pytest.skip(f"Postgres/AGE not reachable at {settings.database_url}")
    await ensure_graph()
    try:
        yield
    finally:
        await close_pool()


@pytest_asyncio.fixture(loop_scope="session")
async def clean_user_graph(graph_ready: None) -> AsyncIterator[str]:
    """Wipe the demo user's TOUCHED subgraph before and after each test."""
    uid = TEST_USER_ID

    async def _wipe() -> None:
        await run_cypher(
            "MATCH (u:User {id:$uid})-[:TOUCHED]->(e:Entity) DETACH DELETE e",
            params={"uid": uid},
        )
        await run_cypher(
            "MATCH (u:User {id:$uid}) DETACH DELETE u", params={"uid": uid}
        )

    await _wipe()
    yield uid
    await _wipe()


@pytest.fixture
def session_store(tmp_path: Path) -> SessionStore:
    """An isolated SessionStore rooted in a per-test tmp directory."""
    return SessionStore(root=tmp_path / "sessions")
