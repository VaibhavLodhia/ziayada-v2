# Deploy ziyada-v2 on Vercel

Vercel hosts the **frontend** (`services/frontend`). The FastAPI backend and Postgres still need a separate host (Railway, Render, Fly.io, or your own VPS).

## 1. Push to GitHub

From the repo root (`ziyada-v2/`):

```bash
git init
git add .
git commit -m "Initial ziyada-v2: Interview UI, chat, sidebars, calm theme"

# Create an empty repo on GitHub named ziyada-v2, then:
git branch -M main
git remote add origin https://github.com/YOUR_USER/ziyada-v2.git
git push -u origin main
```

Replace `YOUR_USER` with your GitHub username or org.

## 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. **Root Directory:** `services/frontend` (required — monorepo layout).
3. **Framework Preset:** Vite (auto-detected).
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Install Command:** `npm install`

## 3. Environment variables (Vercel project settings)

| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Public URL of the FastAPI backend. No trailing slash. |

Leave empty only for a static UI preview (login/chat will fail without a backend).

After the backend is live, set `CORS_ORIGINS` on the backend to include your Vercel URL, e.g.:

```
CORS_ORIGINS=https://ziyada-v2.vercel.app,https://your-custom-domain.com
```

Auth uses HTTP-only cookies (`credentials: include`), so the API must be on HTTPS and CORS must allow your Vercel origin.

## 4. Redeploy

Vercel redeploys on every push to `main`. To deploy from CLI:

```bash
cd services/frontend
npx vercel login
npx vercel --prod
```

Set `VITE_API_BASE_URL` in the Vercel dashboard before the first production deploy, or add it via CLI:

```bash
npx vercel env add VITE_API_BASE_URL production
```

## 5. Backend (not on Vercel)

Use Docker Compose locally, or deploy `services/backend` + Postgres to Railway/Render:

- Expose port 8001 (or 8000)
- Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, voice keys, etc. from `services/backend/.env.example`
- Point `VITE_API_BASE_URL` at that public API URL

## Troubleshooting

- **404 on refresh** — `vercel.json` rewrites all routes to `index.html` for React Router.
- **Login 401 / CORS errors** — backend `CORS_ORIGINS` must list the exact Vercel URL (scheme + host, no path).
- **Voice mic** — requires backend `/api/voice/token` and WebSocket; works only when API is reachable from the browser.
