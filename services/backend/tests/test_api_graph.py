"""End-to-end tests for the graph API.

Uses httpx.AsyncClient + ASGITransport (NOT TestClient) so the HTTP call
shares the same event loop as the AGE graph pool. NO mocks. Skipped
automatically (via the graph_ready/clean_user_graph fixtures) if Postgres/AGE
isn't running.

Auth is overridden to the demo test user so the graph endpoints can be
exercised without a real session cookie.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.auth import current_user_id
from app.extract.persist import persist_graph
from app.extract.schemas import ExtractedEdge, ExtractedGraph, ExtractedNode
from app.main import app

# Must match conftest.TEST_USER_ID (the id clean_user_graph yields).
_TEST_USER_ID = "demo-user"


@pytest_asyncio.fixture(loop_scope="session")
async def async_client() -> AsyncIterator[AsyncClient]:
    app.dependency_overrides[current_user_id] = lambda: _TEST_USER_ID
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.mark.asyncio(loop_scope="session")
async def test_graph_me_returns_persisted_entities(
    clean_user_graph: str, async_client: AsyncClient
) -> None:
    await persist_graph(
        clean_user_graph,
        ExtractedGraph(
            nodes=[
                ExtractedNode(kind="Person", name="Khusrav B."),
                ExtractedNode(kind="System", name="Ziyada Backend"),
            ],
            edges=[
                ExtractedEdge(from_name="Khusrav B.", to_name="Ziyada Backend", relation="OWNS"),
            ],
        ),
        session_id="sess-1",
    )

    r = await async_client.get("/api/graph/me")
    assert r.status_code == 200
    body = r.json()
    names = {n["name"]: n["kind"] for n in body["nodes"]}
    assert names == {"Khusrav B.": "Person", "Ziyada Backend": "System"}
    assert any(
        e["source"] == "Khusrav B." and e["target"] == "Ziyada Backend" and e["relation"] == "OWNS"
        for e in body["edges"]
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_graph_me_filters_by_session_id(
    clean_user_graph: str, async_client: AsyncClient
) -> None:
    user_id = clean_user_graph
    await persist_graph(
        user_id,
        ExtractedGraph(nodes=[ExtractedNode(kind="Person", name="Alice")]),
        session_id="sess-A",
    )
    await persist_graph(
        user_id,
        ExtractedGraph(nodes=[ExtractedNode(kind="Person", name="Bob")]),
        session_id="sess-B",
    )

    all_resp = await async_client.get("/api/graph/me")
    a_resp = await async_client.get("/api/graph/me?session_id=sess-A")
    b_resp = await async_client.get("/api/graph/me?session_id=sess-B")

    assert {n["name"] for n in all_resp.json()["nodes"]} == {"Alice", "Bob"}
    assert {n["name"] for n in a_resp.json()["nodes"]} == {"Alice"}
    assert {n["name"] for n in b_resp.json()["nodes"]} == {"Bob"}


@pytest.mark.asyncio(loop_scope="session")
async def test_graph_me_edges_only_when_both_endpoints_touched_in_session(
    clean_user_graph: str, async_client: AsyncClient
) -> None:
    user_id = clean_user_graph
    await persist_graph(
        user_id,
        ExtractedGraph(
            nodes=[
                ExtractedNode(kind="Person", name="P1"),
                ExtractedNode(kind="System", name="S1"),
            ],
            edges=[ExtractedEdge(from_name="P1", to_name="S1", relation="OWNS")],
        ),
        session_id="sess-1",
    )
    await persist_graph(
        user_id,
        ExtractedGraph(nodes=[ExtractedNode(kind="System", name="S2")]),
        session_id="sess-2",
    )

    edges_s1 = (await async_client.get("/api/graph/me?session_id=sess-1")).json()["edges"]
    edges_s2 = (await async_client.get("/api/graph/me?session_id=sess-2")).json()["edges"]

    assert any(e["source"] == "P1" and e["target"] == "S1" for e in edges_s1)
    # sess-2 only touched S2 → no edges (P1->S1 needs BOTH endpoints touched in sess-2)
    assert edges_s2 == []


@pytest.mark.asyncio(loop_scope="session")
async def test_health_endpoint(async_client: AsyncClient) -> None:
    r = await async_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
