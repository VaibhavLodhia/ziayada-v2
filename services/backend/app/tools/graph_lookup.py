from typing import Any

from langchain_core.tools import tool

from app.db.graph import run_cypher

# Cypher 101 (read this once, refer back when curious):
#
#   MATCH (n)      → find a node, bind it to the variable `n`.
#   (n)-[r]-(m)    → an UN-directed edge between n and m, edge bound to `r`.
#   (n)-[r]->(m)   → a DIRECTED edge (n -> m).
#   WHERE ...      → filter, like SQL.
#   $param         → bound parameter (passed safely as an agtype params object).
#   toLower(x)     → string lowercase. `CONTAINS` does substring match.
#   coalesce(a, b) → first non-null of a, b.
#   type(r)        → the edge's relationship type string ("OWNS", "INVOLVED", ...).
#   properties(m)  → returns the node's properties as a map.
#   label(m)       → the node's (single) label, e.g. "Person". (Apache AGE: one
#                    label per vertex, so this is a scalar, not a list.)
#   LIMIT n        → cap the rows.
#
# The query below: take an entity name/id, find any node whose `name` or `id`
# contains that string (case-insensitive), then return its direct edges.
_LOOKUP_CYPHER = """
MATCH (n)
WHERE toLower(coalesce(n.name, n.id, '')) CONTAINS toLower($entity)
WITH n LIMIT 5
MATCH (n)-[r]-(m)
RETURN
  coalesce(n.name, n.id) AS from_node,
  label(n)               AS from_label,
  type(r)                AS relation,
  coalesce(m.name, m.id) AS to_node,
  label(m)               AS to_label,
  properties(m)          AS to_props
LIMIT 10
"""

_COLUMNS = ["from_node", "from_label", "relation", "to_node", "to_label", "to_props"]


@tool
async def graph_lookup(entity: str) -> list[dict[str, Any]]:
    """Find relationships for an entity in the Ziyada knowledge graph.

    Pass a person name (e.g. 'Khusrav'), decision id (e.g. 'D-2026-052'),
    or system name (e.g. 'Ollama Cloud'). Matches are case-insensitive
    substrings. Returns up to 10 edges with both endpoints' label and
    properties.
    """
    return await run_cypher(_LOOKUP_CYPHER, columns=_COLUMNS, params={"entity": entity})
