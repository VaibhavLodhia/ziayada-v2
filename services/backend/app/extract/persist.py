"""Persist an ExtractedGraph into the Apache AGE graph under a per-user subgraph.

Schema:
    (:User {id})
    (:Entity {name, kind, description})    -- nodes from extraction
    (:User)-[:TOUCHED {sessions, first_at, last_at}]->(:Entity)
    (:Entity)-[r:<RELATION>]->(:Entity)    -- inter-entity edges

Idempotent (MERGE everywhere). Writes are batched with UNWIND:
  - one query for all entity nodes + their TOUCHED edges
  - one query per distinct relation type for inter-entity edges

AGE note: `MERGE ... ON CREATE SET / ON MATCH SET` is unsupported, so the
create-vs-match logic is folded into a single `SET x = coalesce(x, <new>)`
(the field is null on create, so coalesce yields the new value then).
"""

from __future__ import annotations

import logging
import re
from collections import defaultdict
from datetime import UTC, datetime

from app.db.graph import run_cypher
from app.extract.schemas import ExtractedGraph

log = logging.getLogger(__name__)

_VALID_REL = re.compile(r"^[A-Z][A-Z0-9_]{0,40}$")


def _safe_rel(rel: str) -> str:
    """Sanitise the LLM-supplied relation name into a valid Cypher rel type."""
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", rel).strip("_").upper()
    if not cleaned:
        cleaned = "RELATES_TO"
    if not _VALID_REL.match(cleaned):
        cleaned = "RELATES_TO"
    return cleaned


_NODES_UNWIND = """
UNWIND $rows AS row
MERGE (e:Entity {name: row.name})
  SET e.kind = coalesce(e.kind, row.kind),
      e.description = coalesce(row.description, e.description),
      e.created_at = coalesce(e.created_at, $now)
WITH e
MATCH (u:User {id: $uid})
MERGE (u)-[t:TOUCHED]->(e)
  SET t.first_at = coalesce(t.first_at, $now),
      t.last_at = $now,
      t.sessions = CASE
        WHEN $sid IS NULL THEN coalesce(t.sessions, [])
        WHEN $sid IN coalesce(t.sessions, []) THEN t.sessions
        ELSE coalesce(t.sessions, []) + $sid
      END
"""


def _edges_unwind(rel: str) -> str:
    # rel comes from _safe_rel — strictly [A-Z][A-Z0-9_]{0,40} — so f-string is safe.
    return f"""
UNWIND $rows AS row
MATCH (a:Entity {{name: row.from_name}})
MATCH (b:Entity {{name: row.to_name}})
MERGE (a)-[r:{rel}]->(b)
  SET r.created_at = coalesce(r.created_at, $now)
"""


async def persist_graph(
    user_id: str,
    graph: ExtractedGraph,
    session_id: str | None = None,
) -> int:
    """Write the extracted graph for a user. Returns count of entity nodes upserted.

    If session_id is provided, the TOUCHED edge accumulates a deduped list of
    session ids that surfaced this entity — used later for per-session filtering.
    """
    if not graph.nodes and not graph.edges:
        return 0

    now = datetime.now(UTC).isoformat(timespec="seconds")
    written = 0

    await run_cypher("MERGE (u:User {id: $uid})", params={"uid": user_id})

    if graph.nodes:
        node_rows = [
            {"name": n.name, "kind": n.kind, "description": n.description}
            for n in graph.nodes
        ]
        await run_cypher(
            _NODES_UNWIND,
            params={"rows": node_rows, "uid": user_id, "now": now, "sid": session_id},
        )
        written = len(node_rows)

    # Group edges by sanitised relation type; one UNWIND per type.
    by_rel: dict[str, list[dict[str, str]]] = defaultdict(list)
    for edge in graph.edges:
        by_rel[_safe_rel(edge.relation)].append(
            {"from_name": edge.from_name, "to_name": edge.to_name}
        )
    for rel, rows in by_rel.items():
        await run_cypher(_edges_unwind(rel), params={"rows": rows, "now": now})

    log.info(
        "persisted %d entities + %d edges (in %d rel-groups) for user=%s",
        written, len(graph.edges), len(by_rel), user_id,
    )
    return written
