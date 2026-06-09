from fastapi import APIRouter, Depends, Query

from app.api.schemas import GraphEdge, GraphNode, GraphResponse
from app.auth import current_user_id
from app.db.graph import run_cypher
from app.sessions.store import get_store

router = APIRouter(prefix="/api/graph", tags=["graph"])

# Nodes for a user, optionally filtered to entities surfaced in one session.
_NODES_CYPHER = """
MATCH (u:User {id: $uid})-[t:TOUCHED]->(e:Entity)
WHERE $session_id IS NULL OR $session_id IN coalesce(t.sessions, [])
RETURN e.name AS name, e.kind AS kind, e.description AS description
"""

_EDGES_CYPHER = """
MATCH (u:User {id: $uid})-[t1:TOUCHED]->(a:Entity)
MATCH (u)-[t2:TOUCHED]->(b:Entity)
MATCH (a)-[r]->(b)
WHERE type(r) <> 'TOUCHED'
  AND ($session_id IS NULL OR
       ($session_id IN coalesce(t1.sessions, []) AND $session_id IN coalesce(t2.sessions, [])))
RETURN a.name AS source, b.name AS target, type(r) AS relation
"""


@router.get("/me", response_model=GraphResponse)
async def my_graph(
    session_id: str | None = Query(None, description="Filter to one session's entities."),
    user_id: str = Depends(current_user_id),
) -> GraphResponse:
    params = {"uid": user_id, "session_id": session_id}
    nodes_rows = await run_cypher(
        _NODES_CYPHER, columns=["name", "kind", "description"], params=params
    )
    edges_rows = await run_cypher(
        _EDGES_CYPHER, columns=["source", "target", "relation"], params=params
    )

    nodes = [
        GraphNode(
            id=r["name"],
            name=r["name"],
            kind=r["kind"] or "Topic",
            description=r.get("description"),
        )
        for r in nodes_rows
    ]
    edges = [
        GraphEdge(source=r["source"], target=r["target"], relation=r["relation"])
        for r in edges_rows
    ]
    return GraphResponse(nodes=nodes, edges=edges)


@router.get("/me/sessions")
async def my_sessions(user_id: str = Depends(current_user_id)) -> list[dict]:
    return get_store().list_for_user(user_id)
