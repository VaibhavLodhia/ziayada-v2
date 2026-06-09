"""Password hashing via bcrypt directly. Cost 12 — same as passlib's default."""

from __future__ import annotations

import bcrypt

_ROUNDS = 12
_MAX_BYTES = 72  # bcrypt hard limit


def hash_password(plain: str) -> str:
    pw = plain.encode("utf-8")[:_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt(rounds=_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pw = plain.encode("utf-8")[:_MAX_BYTES]
        return bcrypt.checkpw(pw, hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
