"""Ephemeral xAI Realtime voice session tokens (server-side only)."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth_core.dependencies import get_current_user
from app.config import settings
from app.models.user import User

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])

XAI_CLIENT_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets"


class VoiceTokenResponse(BaseModel):
    value: str
    expires_at: int


@router.post("/token", response_model=VoiceTokenResponse)
async def mint_voice_token(_user: User = Depends(get_current_user)) -> VoiceTokenResponse:
    """Mint a short-lived xAI Realtime client secret for the browser WebSocket."""
    if not settings.xai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice service not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                XAI_CLIENT_SECRETS_URL,
                headers={
                    "Authorization": f"Bearer {settings.xai_api_key}",
                    "Content-Type": "application/json",
                },
                json={"expires_after": {"seconds": 300}},
            )
    except httpx.HTTPError as exc:
        log.exception("xAI client_secrets request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach voice provider",
        ) from exc

    if response.status_code != 200:
        log.warning(
            "xAI client_secrets returned %s: %s",
            response.status_code,
            response.text[:200],
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to mint voice token",
        )

    data = response.json()
    value = data.get("value")
    expires_at = data.get("expires_at")
    if not value or expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid voice token response",
        )

    return VoiceTokenResponse(value=value, expires_at=int(expires_at))
