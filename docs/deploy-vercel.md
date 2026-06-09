# Deploy ziayada-v2 on Vercel

Vercel hosts the **frontend**. Backend + Postgres need Railway, Render, or similar.

## Fix 404 NOT_FOUND

That error means **no successful deployment** at that URL — not a routing bug.

1. Repo root has **`vercel.json`** — builds `services/frontend` automatically.
2. In Vercel project **Settings → General**:
   - **Root Directory:** leave **empty** (repo root) so root `vercel.json` is used  
   - OR set `services/frontend` and remove duplicate build overrides
3. **Settings → Build & Development:**
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
4. **Deployments** tab — open latest deploy. If **Failed**, read the build log.
5. Production URL: **https://ziayada-v2.vercel.app** (spelling: **ziayada**)

## GitHub push (Vaibhav only)

```powershell
cd C:\Users\Dell\Desktop\Ziyada\ziyada-v2
git config --local user.name "Vaibhav Lodhia"
git config --local user.email "VaibhavLodhia@users.noreply.github.com"
git add .
git -c commit.gpgsign=false commit -m "Rename to Ziayada and fix Vercel monorepo build"
git push origin main
```

## Vercel import

1. [vercel.com/new](https://vercel.com/new) → import **VaibhavLodhia/ziyada-v2** (GitHub repo name can stay `ziyada-v2`; product name is **Ziayada**).
2. Project name: **ziayada-v2** → gives `ziayada-v2.vercel.app`.
3. **Root Directory:** blank (use repo-root `vercel.json`).
4. Deploy.

## Environment variables (REQUIRED for login)

**Without this, login shows `/api/auth/login 405`** — the browser hits Vercel static hosting, not FastAPI.

### Vercel dashboard

1. Project **ziayada-v2** → **Settings** → **Environment Variables**
2. Add:

| Name | Value | Environments |
|------|-------|----------------|
| `VITE_API_BASE_URL` | `https://YOUR-BACKEND-URL.com` | Production, Preview, Development |

No trailing slash. Example: `https://ziayada-api.up.railway.app`

3. **Deployments** → latest → **⋯** → **Redeploy** (Vite bakes env at **build** time — changing env without redeploy does nothing)

### Backend (separate host — not Vercel)

Deploy `services/backend` + Postgres on Railway, Render, or Fly. Then on the backend set:

```
CORS_ORIGINS=https://ziayada-v2.vercel.app
```

Use the same secrets as `services/backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_BOOTSTRAP_*`, etc.).

Until the API is public, the Vercel UI will load but **auth and chat will not work**.

## CLI deploy

```powershell
cd C:\Users\Dell\Desktop\Ziyada\ziyada-v2
npx vercel login
npx vercel --prod
```
