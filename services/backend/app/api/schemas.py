from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant", "system"]


class ToolInvocation(BaseModel):
    name: str
    args: dict
    result: str | None = None


class ChatMessage(BaseModel):
    role: Role
    content: str
    tool_calls: list[ToolInvocation] | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessage
    tool_calls: list[ToolInvocation] = []
    model: str


class GraphNode(BaseModel):
    id: str
    name: str
    kind: str
    description: str | None = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
