"""Pure tests for chat_service helpers — real langchain message objects, no mocks."""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from app.api.chat_service import extract_tool_invocations, to_langchain_messages
from app.api.schemas import ChatMessage


def test_to_langchain_messages_maps_roles() -> None:
    out = to_langchain_messages(
        [
            ChatMessage(role="system", content="sys"),
            ChatMessage(role="user", content="hi"),
            ChatMessage(role="assistant", content="hello"),
        ]
    )
    assert isinstance(out[0], SystemMessage)
    assert isinstance(out[1], HumanMessage)
    assert isinstance(out[2], AIMessage)
    assert out[1].content == "hi"


def test_extract_tool_invocations_pairs_calls_with_results() -> None:
    ai = AIMessage(
        content="",
        tool_calls=[
            {"id": "call-1", "name": "graph_lookup", "args": {"entity": "Khusrav"}},
            {"id": "call-2", "name": "vector_search", "args": {"query": "owasp"}},
        ],
    )
    tool_result_1 = ToolMessage(content='[{"node":"Khusrav"}]', tool_call_id="call-1")
    tool_result_2 = ToolMessage(content='[{"doc":"owasp.md"}]', tool_call_id="call-2")
    final = AIMessage(content="Here is the answer.")

    invocations = extract_tool_invocations([ai, tool_result_1, tool_result_2, final])

    assert len(invocations) == 2
    by_name = {i.name: i for i in invocations}
    assert by_name["graph_lookup"].args == {"entity": "Khusrav"}
    assert by_name["graph_lookup"].result == '[{"node":"Khusrav"}]'
    assert by_name["vector_search"].result == '[{"doc":"owasp.md"}]'


def test_extract_tool_invocations_handles_call_without_result() -> None:
    ai = AIMessage(
        content="",
        tool_calls=[{"id": "call-1", "name": "graph_lookup", "args": {"entity": "X"}}],
    )
    # No ToolMessage paired — call is in-flight or aborted
    invocations = extract_tool_invocations([ai])
    assert len(invocations) == 1
    assert invocations[0].result is None


def test_extract_tool_invocations_ignores_orphan_tool_message() -> None:
    # ToolMessage without a matching AIMessage call_id — should be silently skipped
    orphan = ToolMessage(content="stray", tool_call_id="unknown")
    final = AIMessage(content="done")
    assert extract_tool_invocations([orphan, final]) == []
