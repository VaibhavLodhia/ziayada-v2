"""LLM-driven extraction of entities + edges from a chat transcript."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.extract.schemas import ExtractedGraph
from app.providers.ollama_cloud import build_chat_llm

log = logging.getLogger(__name__)

_SYSTEM = (
    "You read a short conversation and extract the named entities and the "
    "relationships between them. Include things that appear ANYWHERE in the "
    "transcript: in user messages, assistant messages, OR in tool results "
    "(those are real data the assistant looked up and cited). "
    "Skip pleasantries, opinions, and meta-talk about the conversation itself. "
    "Every edge's from_name and to_name must exactly match a node name. "
    "If the transcript is empty or trivial, return an empty graph."
)


def _format_tool_call(call: dict[str, Any]) -> list[str]:
    """Render a tool_call dict (name/args/result) as transcript lines."""
    lines: list[str] = []
    name = call.get("name", "tool")
    args = call.get("args") or {}
    lines.append(f"TOOL_CALL: {name}({json.dumps(args, separators=(',', ':'))})")
    result = call.get("result")
    if result:
        # Truncate huge results so the extractor isn't drowned.
        text = result if len(result) < 2000 else result[:2000] + "…"
        lines.append(f"TOOL_RESULT: {text}")
    return lines


def _transcript(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for m in messages:
        role = str(m.get("role", "")).upper()
        content = str(m.get("content", "")).strip()
        if content:
            lines.append(f"{role}: {content}")
        for call in m.get("tool_calls") or []:
            lines.extend(_format_tool_call(call))
    return "\n".join(lines)


async def extract_from_messages(messages: list[dict[str, Any]]) -> ExtractedGraph:
    transcript = _transcript(messages)
    if not transcript.strip():
        return ExtractedGraph()

    llm = build_chat_llm()
    structured = llm.with_structured_output(ExtractedGraph)
    try:
        result = await structured.ainvoke(
            [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": f"Transcript:\n\n{transcript}"},
            ]
        )
    except Exception as e:
        log.warning("extraction failed: %s", e)
        return ExtractedGraph()

    return result if isinstance(result, ExtractedGraph) else ExtractedGraph()
