"""Typed schema for what we extract from chat transcripts.

The LLM returns JSON conforming to ExtractedGraph; pydantic validates it,
so downstream code never touches free-form strings.
"""

from typing import Literal

from pydantic import BaseModel, Field

EntityKind = Literal["Person", "Decision", "System", "Organization", "Topic"]


class ExtractedNode(BaseModel):
    kind: EntityKind = Field(..., description="The category of the entity.")
    name: str = Field(..., description="Canonical display name. Keep short.")
    description: str | None = Field(
        default=None, description="One short sentence of context if useful."
    )


class ExtractedEdge(BaseModel):
    from_name: str = Field(..., description="Name of the source node (must match a node above).")
    to_name: str = Field(..., description="Name of the target node (must match a node above).")
    relation: str = Field(
        ...,
        description=(
            "Uppercase snake_case relation, e.g. INVOLVED_IN, DEPENDS_ON, "
            "MENTIONED, RELATES_TO, OWNS, REPORTS_TO."
        ),
    )


class ExtractedGraph(BaseModel):
    nodes: list[ExtractedNode] = Field(default_factory=list)
    edges: list[ExtractedEdge] = Field(default_factory=list)
