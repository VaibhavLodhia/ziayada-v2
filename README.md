# Ziyada V2

Private intelligence layer with the Interview design language.

v2 introduces the Interview design language. Backend, auth, voice, and contracts are unchanged from v1.

## Layout

```
ziyada-v2/
├── contracts/          # API and stream event schemas (from v1)
├── deploy/             # Deployment configs (from v1)
├── docs/               # Architecture and design notes
└── services/
    ├── backend/        # FastAPI (byte-identical copy from v1)
    └── frontend/       # React + Vite, Interview design (new)
```

## Ports (runs alongside v1)

| Service  | URL                      | Notes              |
|----------|--------------------------|--------------------|
| Frontend | http://localhost:5174    | v1 uses 5173       |
| Backend  | http://localhost:8001    | v1 uses 8000       |
| Postgres | localhost:5433           | v1 uses 5432       |

## Quick start

### 1. Create env files

```bash
cp .env.example .env
cp services/backend/.env.example services/backend/.env
cp services/frontend/.env.example services/frontend/.env
```

Generate secrets (same as v1). In root `.env` set `POSTGRES_PASSWORD`. In `services/backend/.env` set `DATABASE_URL`, `JWT_SECRET`, bootstrap admin, `OLLAMA_API_KEY`, and optional `XAI_API_KEY` for voice.

Use port **5433** when connecting to Postgres from the host. Inside Docker Compose the hostname is still `postgres` on port 5432.

Set `CORS_ORIGINS=http://localhost:5174` in backend env (already in `.env.example`).

### 2. Start stack

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

First boot may take a few minutes (Postgres image pull, backend build, `npm ci`).

### 3. Open the app

http://localhost:5174

Sign up or use the bootstrap admin from `services/backend/.env`.

## Frontend dev (native)

```bash
cd services/frontend
npm install
npm run dev
```

Proxy targets `http://localhost:8001` by default.

## Generate API types

With backend running on 8001:

```bash
cd services/frontend
npm run gen:types
```

## Tests (backend)

```bash
cd services/backend
pip install -r requirements-dev.txt
pytest
```

## Design

Interview surfaces use Fraunces typography, Geist Mono for hashes and metadata, and five mediation states (RESPOND, NARROW, FLAG, DEFER, EXPLORE) shown only at seal time. See `docs/design-evolution.md`.

## Deploy (Vercel)

Frontend only. See **[docs/deploy-vercel.md](docs/deploy-vercel.md)** for GitHub push, Vercel import, and `VITE_API_BASE_URL` setup.

Quick Vercel settings:

- **Root directory:** `services/frontend`
- **Env:** `VITE_API_BASE_URL=https://your-api-host` (backend must allow your Vercel origin in `CORS_ORIGINS`)
