# Ziyada V2 Architecture

## Overview

Ziyada V2 reuses the v1 backend unchanged and rebuilds the frontend in the Interview design language. The browser talks to the same FastAPI services: cookie JWT auth, SSE chat stream with LangGraph and tools, voice token minting for xAI Realtime, Apache AGE graph in Postgres, and admin endpoints.

## Backend (unchanged from v1)

Located at `services/backend/`. Copied byte-identical from `ziyada-main/services/backend/`. Key routes:

- `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me`
- `POST /api/chat`, `POST /api/chat/stream`
- `POST /api/voice/token`
- `GET /api/graph/me`, `/api/graph/me/sessions`
- `GET/PATCH /api/admin/users`, `GET /api/admin/stats`

## Frontend (new)

Located at `services/frontend/`. Vite + React + TypeScript + Tailwind + Zustand.

### Primitives (`src/components/primitives/`)

| Component     | Role                                      |
|---------------|-------------------------------------------|
| Brand         | Wordmark, navigates home                  |
| Field         | Universal input with mic and send         |
| Pill          | Labels and badges                         |
| StatePill     | Mediation state badge                     |
| TrustPill     | PRIVATE / SHARED / PUBLIC                 |
| HashSeal      | 6-char audit hash, copy on click          |
| Stamp         | Wax seal at decision moment               |
| Glyph         | Five state SVG icons                      |
| ClassifyRow   | Seal-time classification row              |
| DecisionRow   | List row pattern                          |
| TopBar        | Shell header                              |
| HaloMenu      | Identity menu                             |
| ThemeCorner   | Theme toggle                              |
| LoadingScreen | Boot splash                               |
| EmptyState    | Empty list placeholder                    |

### State (`src/state/`)

- `authSlice`: user session via cookie + `getMe()`
- `interviewSlice`: home interview phases and demo ledger
- `uiSlice`: theme and halo menu

### Routes

| Path               | View              |
|--------------------|-------------------|
| `/home`            | Interview surface |
| `/login`, `/signup`| Auth              |
| `/dashboard`       | Today summary     |
| `/decisions`       | Decision ledger   |
| `/decisions/:hash` | Record detail     |
| `/sessions`        | Chat sessions     |
| `/captures`        | Captured thoughts |
| `/outcomes`        | Outcome register  |
| `/agents`          | My agents         |
| `/agents/public`   | Public agents     |
| `/capture-flow`    | Capture wizard    |
| `/shared-links`    | Shared links      |
| `/graph`           | Knowledge graph   |
| `/admin`           | Admin panel       |
| `/shared`          | Phase 2 stub      |
| `/public`          | Phase 3 stub      |

## Contracts

`contracts/stream-events.schema.json` defines SSE event shapes consumed by `chatStream`.

## Docker

Root `docker-compose.dev.yml` runs Postgres (5433), backend (8001), frontend (5174) with v2-specific container and volume names so v1 can run in parallel.
