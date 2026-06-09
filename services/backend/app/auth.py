"""Backward-compat seam for "who is the current user?".

The real implementation lives in `app.auth_core.dependencies`. This module
re-exports `current_user_id` (now a FastAPI dependency) so existing routers
that do `from app.auth import current_user_id` keep working — they just need
to switch from `current_user_id()` to `Depends(current_user_id)`.
"""

from app.auth_core.dependencies import current_user_id, get_current_user, require_admin

__all__ = ["current_user_id", "get_current_user", "require_admin"]
