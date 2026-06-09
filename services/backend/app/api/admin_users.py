"""Admin-only endpoints: user list, role/active toggles, stats."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_core.dependencies import require_admin
from app.db.graph import run_cypher
from app.db.postgres import get_session
from app.models.user import User, UserRole
from app.sessions.store import get_store

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# --- Schemas --------------------------------------------------------------


class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["user", "admin"]
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None
    session_count: int
    entity_count: int


class UserPatchRequest(BaseModel):
    role: Literal["user", "admin"] | None = None
    is_active: bool | None = None


class StatsResponse(BaseModel):
    users_total: int
    users_active: int
    admins: int
    sessions_total: int
    entities_total: int


# --- Helpers --------------------------------------------------------------


def _count_sessions_for_user(user_id: str) -> int:
    """Count session JSON files belonging to a user. Best-effort, no exceptions."""
    import json

    store = get_store()
    count = 0
    for p in store.root.glob("*.json"):
        try:
            sess = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if sess.get("user_id") == user_id:
            count += 1
    return count


def _count_all_sessions() -> int:
    """Total session files on disk."""
    return sum(1 for _ in get_store().root.glob("*.json"))


async def _entity_count_for_user(user_id: str) -> int:
    rows = await run_cypher(
        "MATCH (:User {id:$uid})-[:TOUCHED]->(e:Entity) RETURN count(e) AS c",
        columns=["c"],
        params={"uid": user_id},
    )
    return int(rows[0]["c"]) if rows else 0


async def _entity_count_total() -> int:
    rows = await run_cypher(
        "MATCH (e:Entity) RETURN count(e) AS c", columns=["c"]
    )
    return int(rows[0]["c"]) if rows else 0


def _user_to_admin_response(
    user: User, session_count: int, entity_count: int
) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        session_count=session_count,
        entity_count=entity_count,
    )


async def _active_admin_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(User.role == UserRole.ADMIN, User.is_active.is_(True))
    )
    return int(result.scalar_one() or 0)


# --- Endpoints ------------------------------------------------------------


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> list[AdminUserResponse]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    out: list[AdminUserResponse] = []
    for u in users:
        out.append(
            _user_to_admin_response(
                u,
                session_count=_count_sessions_for_user(u.id),
                entity_count=await _entity_count_for_user(u.id),
            )
        )
    return out


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def patch_user(
    user_id: str,
    patch: UserPatchRequest,
    caller: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> AdminUserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Lockout protection: caller must not demote/disable themselves.
    if target.id == caller.id:
        demoting = patch.role is not None and patch.role != UserRole.ADMIN.value
        disabling = patch.is_active is False
        if demoting or disabling:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot demote or disable yourself",
            )

    # Compute the post-change state and re-check the active-admin invariant.
    new_role = (
        UserRole(patch.role) if patch.role is not None else target.role
    )
    new_active = patch.is_active if patch.is_active is not None else target.is_active

    was_active_admin = target.role == UserRole.ADMIN and target.is_active
    will_be_active_admin = new_role == UserRole.ADMIN and new_active

    if was_active_admin and not will_be_active_admin:
        current_count = await _active_admin_count(db)
        if current_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last active admin",
            )

    target.role = new_role
    target.is_active = new_active
    await db.commit()
    await db.refresh(target)

    return _user_to_admin_response(
        target,
        session_count=_count_sessions_for_user(target.id),
        entity_count=await _entity_count_for_user(target.id),
    )


@router.get("/stats", response_model=StatsResponse)
async def stats(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> StatsResponse:
    users_total = int(
        (await db.execute(select(func.count()).select_from(User))).scalar_one() or 0
    )
    users_active = int(
        (
            await db.execute(
                select(func.count()).select_from(User).where(User.is_active.is_(True))
            )
        ).scalar_one()
        or 0
    )
    admins = int(
        (
            await db.execute(
                select(func.count())
                .select_from(User)
                .where(User.role == UserRole.ADMIN)
            )
        ).scalar_one()
        or 0
    )
    return StatsResponse(
        users_total=users_total,
        users_active=users_active,
        admins=admins,
        sessions_total=_count_all_sessions(),
        entities_total=await _entity_count_total(),
    )
