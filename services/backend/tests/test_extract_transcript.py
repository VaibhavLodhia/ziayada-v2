"""Pure-function tests for the tool-aware transcript renderer."""

from __future__ import annotations

from app.extract.entities import _transcript


def test_renders_user_and_assistant_lines() -> None:
    out = _transcript(
        [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello"},
        ]
    )
    assert "USER: hi" in out
    assert "ASSISTANT: hello" in out


def test_includes_tool_calls_and_results_inline() -> None:
    out = _transcript(
        [
            {"role": "user", "content": "who is Khusrav"},
            {
                "role": "assistant",
                "content": "Khusrav owns Ziyada Backend.",
                "tool_calls": [
                    {
                        "name": "graph_lookup",
                        "args": {"entity": "Khusrav"},
                        "result": '[{"from_node":"Khusrav","to_node":"Ziyada Backend"}]',
                    }
                ],
            },
        ]
    )
    assert "TOOL_CALL: graph_lookup" in out
    assert '"entity":"Khusrav"' in out
    assert "TOOL_RESULT:" in out
    assert "Ziyada Backend" in out


def test_skips_empty_content_lines_but_still_renders_tool_calls() -> None:
    out = _transcript(
        [
            {
                "role": "assistant",
                "content": "",
                "tool_calls": [{"name": "graph_lookup", "args": {"entity": "X"}, "result": "ok"}],
            }
        ]
    )
    assert "ASSISTANT:" not in out  # empty content suppressed
    assert "TOOL_CALL: graph_lookup" in out
    assert "TOOL_RESULT: ok" in out


def test_truncates_huge_tool_results() -> None:
    huge = "x" * 5000
    out = _transcript(
        [
            {
                "role": "assistant",
                "content": "ok",
                "tool_calls": [{"name": "vector_search", "args": {}, "result": huge}],
            }
        ]
    )
    # 2000 char cap + ellipsis
    assert "x" * 2000 in out
    assert "…" in out
    assert "x" * 2500 not in out


def test_empty_messages_returns_empty_string() -> None:
    assert _transcript([]) == ""
