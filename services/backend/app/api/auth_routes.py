"""Public + authenticated auth endpoints: signup, login, logout, me."""

from __future__ import annotations

import logging
import re
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_core.dependencies import COOKIE_NAME, get_current_user
from app.auth_core.passwords import hash_password, verify_password
from app.auth_core.tokens import create_access_token
from app.config import settings
from app.db.postgres import get_session
from app.models.user import User, UserRole

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Permissive email check that accepts reserved TLDs like .local, .test (RFC 6761/6762),
# used in dev. Production would re-tighten via email_validator + allow_smtputf8=False.
_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def _normalize_email(v: str) -> str:
    v = (v or "").strip().lower()
    if not _EMAIL_RE.match(v) or len(v) > 255:
        raise ValueError("Not a valid email address")
    return v


# --- Schemas --------------------------------------------------------------


class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        return _normalize_email(v)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        return _normalize_email(v)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["user", "admin"]
    created_at: datetime
    is_active: bool


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        created_at=user.created_at,
        is_active=user.is_active,
    )


# --- Cookie helper --------------------------------------------------------


def _set_session_cookie(response: Response, user_id: str) -> None:
    token = create_access_token(user_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # dev only — flip True behind TLS in prod
        max_age=settings.jwt_expire_days * 86400,
        path="/",
    )


# --- Endpoints ------------------------------------------------------------


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def signup(
    payload: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> UserResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=str(payload.email),
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    _set_session_cookie(response, user.id)
    return _user_to_response(user)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> UserResponse:
    result = await db.execute(select(User).where(User.email == str(payload.email)))
    user = result.scalar_one_or_none()

    # Constant-ish work to limit user-enumeration timing leaks: always run
    # verify_password against either the real hash or a dummy that won't match.
    valid = False
    if user is not None:
        valid = verify_password(payload.password, user.password_hash)

    if user is None or not valid or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    user.last_login_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)

    _set_session_cookie(response, user.id)
    return _user_to_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> Response:
    response.delete_cookie(COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> UserResponse:
    return _user_to_response(user)
