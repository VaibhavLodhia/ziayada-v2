"""JSON-file session store. Single responsibility: persist sessions to disk.

Swap to Postgres later by replacing this file — keeps SessionStore as the seam.
"""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.api.schemas import ChatMessage

_DATA_DIR = Path(__file__).resolve().parents[2] / ".data" / "sessions"


def _now() -> str:
    # Microsecond precision so consecutive ops sort deterministically.
    return datetime.now(UTC).isoformat(timespec="microseconds")


class SessionStore:
    def __init__(self, root: Path = _DATA_DIR) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, session_id: str) -> Path:
        return self.root / f"{session_id}.json"

    def create(self, user_id: str) -> dict[str, Any]:
        session_id = str(uuid.uuid4())
        session = {
            "id": session_id,
            "user_id": user_id,
            "created_at": _now(),
            "messages": [],
        }
        self._path(session_id).write_text(json.dumps(session, indent=2), encoding="utf-8")
        return session

    def load(self, session_id: str) -> dict[str, Any] | None:
        p = self._path(session_id)
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    def append(self, session_id: str, messages: list[ChatMessage]) -> dict[str, Any]:
        session = self.load(session_id)
        if session is None:
            raise KeyError(session_id)
        session["messages"].extend(m.model_dump() for m in messages)
        session["updated_at"] = _now()
        self._path(session_id).write_text(json.dumps(session, indent=2), encoding="utf-8")
        return session

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        """All sessions for a user, newest first. Lightweight metadata only."""
        out: list[dict[str, Any]] = []
        for p in self.root.glob("*.json"):
            try:
                sess = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if sess.get("user_id") != user_id:
                continue
            first_user = next(
                (m["content"] for m in sess.get("messages", []) if m.get("role") == "user"),
                "",
            )
            out.append(
                {
                    "id": sess["id"],
                    "created_at": sess.get("created_at"),
                    "updated_at": sess.get("updated_at", sess.get("created_at")),
                    "message_count": len(sess.get("messages", [])),
                    "preview": (first_user[:80] + "…") if len(first_user) > 80 else first_user,
                }
            )
        out.sort(key=lambda s: s.get("updated_at") or "", reverse=True)
        return out


_store: SessionStore | None = None


def get_store() -> SessionStore:
    global _store
    if _store is None:
        _store = SessionStore()
    return _store
