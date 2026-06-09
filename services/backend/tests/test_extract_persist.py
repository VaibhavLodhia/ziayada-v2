"""Real-AGE tests for persist_graph. Requires the docker-compose Postgres/AGE
to be running. Skipped automatically (via the graph_ready fixture) if not."""

from __future__ import annotations

import pytest

from app.db.graph import run_cypher
from app.extract.persist import _safe_rel, persist_graph
from app.extract.schemas import ExtractedEdge, ExtractedGraph, ExtractedNode


def test_safe_rel_uppercases_and_strips_garbage() -> None:
    assert _safe_rel("owns") == "OWNS"
    assert _safe_rel("reports_to") == "REPORTS_TO"
    assert _safe_rel("Concerned About") == "CONCERNED_ABOUT"
    assert _safe_rel("") == "RELATES_TO"
    assert _safe_rel("1starts_with_digit") == "RELATES_TO"
    # injection attempt — Cypher metacharacters become underscores, trailing stripped
    assert _safe_rel("X]->(:Evil)<-[") == "X_____EVIL"
    # >41-char cap fallback (regex allows max 41 incl. first char → falls through)
    assert _safe_rel("A" * 100) == "RELATES_TO"


@pytest.mark.asyncio(loop_scope="session")
async def test_persist_graph_writes_entities_and_tags_session(
    clean_user_graph: str,
) -> None:
    user_id = clean_user_graph
    graph = ExtractedGraph(
        nodes=[
            ExtractedNode(kind="Person", name="Khusrav B.", description="Backend lead"),
            ExtractedNode(kind="System", name="Ziyada Backend", description="Core API"),
        ],
        edges=[
            ExtractedEdge(from_name="Khusrav B.", to_name="Ziyada Backend", relation="OWNS"),
        ],
    )

    written = await persist_graph(user_id, graph, session_id="sess-1")
    assert written == 2

    nodes = await run_cypher(
        "MATCH (e:Entity) RETURN e.name AS n, e.kind AS k", columns=["n", "k"]
    )
    edges = await run_cypher(
        "MATCH (:User {id:$uid})-[:TOUCHED]->(a)-[r]->(b) "
        "RETURN a.name AS a, type(r) AS t, b.name AS b",
        columns=["a", "t", "b"],
        params={"uid": user_id},
    )
    touched = await run_cypher(
        "MATCH (:User {id:$uid})-[t:TOUCHED]->(e) RETURN e.name AS n, t.sessions AS s",
        columns=["n", "s"],
        params={"uid": user_id},
    )

    names = {n["n"]: n["k"] for n in nodes}
    assert names == {"Khusrav B.": "Person", "Ziyada Backend": "System"}
    assert {(e["a"], e["t"], e["b"]) for e in edges} == {
        ("Khusrav B.", "OWNS", "Ziyada Backend"),
    }
    for row in touched:
        assert "sess-1" in row["s"]


@pytest.mark.asyncio(loop_scope="session")
async def test_persist_graph_is_idempotent_and_accumulates_sessions(
    clean_user_graph: str,
) -> None:
    user_id = clean_user_graph
    graph = ExtractedGraph(
        nodes=[ExtractedNode(kind="Person", name="Layla")],
        edges=[],
    )

    await persist_graph(user_id, graph, session_id="sess-1")
    await persist_graph(user_id, graph, session_id="sess-2")
    await persist_graph(user_id, graph, session_id="sess-1")  # duplicate — must not double

    count = await run_cypher(
        "MATCH (n:Entity {name:'Layla'}) RETURN count(n) AS c", columns=["c"]
    )
    touched = await run_cypher(
        "MATCH (:User {id:$uid})-[t:TOUCHED]->(:Entity {name:'Layla'}) RETURN t.sessions AS s",
        columns=["s"],
        params={"uid": user_id},
    )

    assert count and count[0]["c"] == 1
    assert touched
    assert sorted(touched[0]["s"]) == ["sess-1", "sess-2"]


@pytest.mark.asyncio(loop_scope="session")
async def test_persist_graph_no_op_on_empty_graph(clean_user_graph: str) -> None:
    written = await persist_graph(clean_user_graph, ExtractedGraph(), session_id="sess-x")
    assert written == 0


@pytest.mark.asyncio(loop_scope="session")
async def test_persist_graph_groups_edges_by_relation_type(
    clean_user_graph: str,
) -> None:
    user_id = clean_user_graph
    graph = ExtractedGraph(
        nodes=[
            ExtractedNode(kind="Person", name="P1"),
            ExtractedNode(kind="Person", name="P2"),
            ExtractedNode(kind="System", name="S1"),
        ],
        edges=[
            ExtractedEdge(from_name="P1", to_name="S1", relation="OWNS"),
            ExtractedEdge(from_name="P2", to_name="S1", relation="OWNS"),
            ExtractedEdge(from_name="P1", to_name="P2", relation="REPORTS_TO"),
        ],
    )
    await persist_graph(user_id, graph, session_id="sess-1")

    # Scope the count to edges among THIS user's TOUCHED entities — otherwise
    # the canonical bootstrap seed (Decisions/Systems/People) inflates totals.
    rels = await run_cypher(
        "MATCH (:User {id:$uid})-[:TOUCHED]->(a:Entity) "
        "MATCH (:User {id:$uid})-[:TOUCHED]->(b:Entity) "
        "MATCH (a)-[r]->(b) WHERE type(r) <> 'TOUCHED' "
        "RETURN type(r) AS t",
        columns=["t"],
        params={"uid": user_id},
    )
    touched = await run_cypher(
        "MATCH (:User {id:$uid})-[:TOUCHED]->(e:Entity) RETURN count(e) AS c",
        columns=["c"],
        params={"uid": user_id},
    )

    counts: dict[str, int] = {}
    for r in rels:
        counts[r["t"]] = counts.get(r["t"], 0) + 1
    assert counts.get("OWNS") == 2
    assert counts.get("REPORTS_TO") == 1
    assert touched and touched[0]["c"] == 3
