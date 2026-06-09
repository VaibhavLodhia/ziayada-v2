"""JWT issuance and verification.

Tokens carry `sub` (user id) and `exp` (unix timestamp). HS256 with the
shared secret from settings.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.config import settings

log = logging.getLogger(__name__)


def create_access_token(user_id: str) -> str:
    now = datetime.now(UTC)
    exp = now + timedelta(days=settings.jwt_expire_days)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    """Return the decoded claims dict, or None if invalid/expired."""
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as e:
        log.debug("jwt decode failed: %s", e)
        return None
