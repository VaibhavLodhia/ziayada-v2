"""Wire contract for the SSE chat stream (`POST /api/chat/stream`).

This module is the SINGLE SOURCE OF TRUTH for the streaming event shapes.
OpenAPI can't describe a `text/event-stream` body, so the frontend generates
its TS types from this union's JSON Schema instead of hand-writing them:

    python scripts/export_stream_schema.py        # -> contracts/stream-events.schema.json
    (frontend) npm run gen:stream                 # -> src/lib/stream-events.gen.ts

Change an event here and regenerate — never edit the generated TS by hand.
The shapes below must stay byte-identical to what `chat_stream._event_stream`
emits; `_sse()` serialises these models directly so they can't drift.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter


class _StreamEventBase(BaseModel):
    # Fixed-shape wire frames — forbid extras so the generated TS interfaces are
    # exact (no `[k: string]: unknown` escape hatch that hides field typos).
    model_config = ConfigDict(extra="forbid")


class SessionEvent(_StreamEventBase):
    """First event — carries the (possibly newly created) session id."""

    type: Literal["session"]
    session_id: str


class TokenEvent(_StreamEventBase):
    """An assistant token chunk."""

    type: Literal["token"]
    delta: str


class ToolEvent(_StreamEventBase):
    """A tool invocation has started."""

    type: Literal["tool"]
    id: str
    name: str
    args: dict[str, Any] = Field(default_factory=dict)


class ToolResultEvent(_StreamEventBase):
    """A tool invocation has finished."""

    type: Literal["tool_result"]
    id: str
    name: str
    result: str


class ErrorEvent(_StreamEventBase):
    """A fatal stream error; the stream still terminates with `done`."""

    type: Literal["error"]
    message: str


class DoneEvent(_StreamEventBase):
    """Terminal event — always the last frame."""

    type: Literal["done"]


# Discriminated on `type` so generators emit a clean tagged union and Pydantic
# validates inbound frames in one shot.
StreamEvent = Annotated[
    SessionEvent | TokenEvent | ToolEvent | ToolResultEvent | ErrorEvent | DoneEvent,
    Field(discriminator="type"),
]

# Use `.json_schema()` to export the contract and `.validate_python()` to parse.
StreamEventAdapter: TypeAdapter[StreamEvent] = TypeAdapter(StreamEvent)
