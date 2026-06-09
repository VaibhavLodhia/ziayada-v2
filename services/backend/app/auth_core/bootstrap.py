"""First-boot admin bootstrap. Idempotent — only fires when DB is empty."""

from __future__ import annotations

import logging

from sqlalchemy import func, select

from app.auth_core.passwords import hash_password
from app.config import settings
from app.db.postgres import async_session_factory
from app.models.user import User, UserRole

log = logging.getLogger(__name__)


async def bootstrap_admin() -> None:
    if not settings.admin_bootstrap_email or not settings.admin_bootstrap_password:
        log.info("[bootstrap] skipped — no ADMIN_BOOTSTRAP_* set")
        return

    async with async_session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(User))
        if count and count > 0:
            log.info("[bootstrap] skipped — users already exist")
            return

        admin = User(
            email=settings.admin_bootstrap_email,
            name=settings.admin_bootstrap_name or "Admin",
            password_hash=hash_password(settings.admin_bootstrap_password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        log.info("[bootstrap] created admin %s", admin.email)
