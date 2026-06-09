"""Async SQLAlchemy engine + session factory for Postgres.

The engine is created once at import time; init_db() creates tables on
first boot. The graph layer (app/db/graph.py) shares this same database.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

log = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _ensure_engine() -> AsyncEngine:
    """Lazily create the engine + session factory on first real use.

    Built lazily (not at import) so importing the app never requires a valid
    DATABASE_URL — e.g. CI test collection or any tooling that imports
    app.main without a database. Creating an engine from an empty URL raises.
    """
    global _engine, _session_factory
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url, echo=False, pool_pre_ping=True
        )
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def async_session_factory() -> AsyncSession:
    """Return a new AsyncSession (initialises the engine on first call)."""
    _ensure_engine()
    assert _session_factory is not None
    return _session_factory()


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding an AsyncSession."""
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    """Create all tables. Idempotent — does nothing if tables already exist."""
    # Import models so they're registered on Base.metadata before create_all.
    from app.models import user  # noqa: F401

    engine = _ensure_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("[postgres] tables ensured")


async def dispose_engine() -> None:
    if _engine is not None:
        await _engine.dispose()
