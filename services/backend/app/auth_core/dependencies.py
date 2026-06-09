"""FastAPI dependencies for auth: extract user from cookie, gate by role."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_core.tokens import decode_token
from app.db.postgres import get_session
from app.models.user import User, UserRole

COOKIE_NAME = "ziyada_session"


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> User:
    """Read session cookie, decode JWT, fetch live user record.

    Raises 401 on any failure (missing cookie, bad token, no such user,
    or user.is_active=False).
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    claims = decode_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return user


async def current_user_id(user: User = Depends(get_current_user)) -> str:
    """Backward-compat shim — what existing routers depend on."""
    return user.id
