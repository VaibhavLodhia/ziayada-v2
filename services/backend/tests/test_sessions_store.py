"""Real-filesystem tests for SessionStore. No mocks."""

from __future__ import annotations

import time

from app.api.schemas import ChatMessage, ToolInvocation
from app.sessions.store import SessionStore


def test_create_returns_session_with_id_and_persists_to_disk(session_store: SessionStore) -> None:
    s = session_store.create("alice")
    assert s["user_id"] == "alice"
    assert s["messages"] == []
    assert s["id"]
    assert (session_store.root / f"{s['id']}.json").exists()


def test_load_missing_returns_none(session_store: SessionStore) -> None:
    assert session_store.load("does-not-exist") is None


def test_load_round_trips_created_session(session_store: SessionStore) -> None:
    created = session_store.create("alice")
    loaded = session_store.load(created["id"])
    assert loaded is not None
    assert loaded["id"] == created["id"]
    assert loaded["user_id"] == "alice"


def test_append_persists_user_and_assistant_with_tool_calls(session_store: SessionStore) -> None:
    s = session_store.create("alice")
    user = ChatMessage(role="user", content="who is Khusrav")
    assistant = ChatMessage(
        role="assistant",
        content="Khusrav owns Ziyada Backend.",
        tool_calls=[
            ToolInvocation(
                name="graph_lookup",
                args={"entity": "Khusrav"},
                result='[{"from_node":"Khusrav"}]',
            )
        ],
    )
    session_store.append(s["id"], [user, assistant])

    loaded = session_store.load(s["id"])
    assert loaded is not None
    assert len(loaded["messages"]) == 2
    assert loaded["messages"][0]["role"] == "user"
    assert loaded["messages"][1]["tool_calls"][0]["name"] == "graph_lookup"
    assert loaded["messages"][1]["tool_calls"][0]["result"].startswith("[{")


def test_list_for_user_filters_and_orders_by_updated_at(session_store: SessionStore) -> None:
    a1 = session_store.create("alice")
    a2 = session_store.create("alice")
    b1 = session_store.create("bob")

    # Touch a2 last so it should sort newest-first.
    # Sleep is needed because Windows clock granularity can otherwise tie timestamps.
    session_store.append(a1["id"], [ChatMessage(role="user", content="hi-a1-first")])
    time.sleep(0.01)
    session_store.append(a2["id"], [ChatMessage(role="user", content="hi-a2-newer")])

    listing = session_store.list_for_user("alice")
    ids = [s["id"] for s in listing]
    assert b1["id"] not in ids
    assert set(ids) == {a1["id"], a2["id"]}
    # a2 was updated last, must come first
    assert listing[0]["id"] == a2["id"]
    assert listing[0]["preview"] == "hi-a2-newer"
    assert listing[0]["message_count"] == 1


def test_list_for_user_skips_malformed_json(session_store: SessionStore) -> None:
    session_store.create("alice")
    (session_store.root / "garbage.json").write_text("{not json", encoding="utf-8")
    # must not raise; just skip the broken file
    listing = session_store.list_for_user("alice")
    assert len(listing) == 1
