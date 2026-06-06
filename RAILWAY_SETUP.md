# Deploying Prism to Railway

## Prerequisites

- [Railway account](https://railway.app) (free tier works)
- Railway CLI: `npm install -g @railway/cli`
- GitHub repo pushed

---

## Step 1 — Create a new project on Railway

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Empty Project"**
3. Name it `prism`

---

## Step 2 — Add a PostgreSQL database

In your Railway project:
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway provisions a Postgres instance and gives you `DATABASE_URL` in the service variables — copy it.

---

## Step 3 — Create the API service

```bash
cd apps/api
railway link          # select your project
railway up --service api
```

Set environment variables in the Railway dashboard for the `api` service:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste the Postgres URL from Step 2) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `PORT` | `8000` |

---

## Step 4 — Create the Web service

```bash
cd apps/web
railway link          # select same project
railway up --service web
```

Set environment variables for the `web` service:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL of your deployed API (e.g. `https://prism-api.up.railway.app`) |
| `PORT` | `3000` |

---

## Step 5 — Set up GitHub Actions auto-deploy

1. In Railway dashboard → project settings → **"Generate Token"** → copy it
2. In your GitHub repo → Settings → Secrets → **"New secret"**
   - Name: `RAILWAY_TOKEN`
   - Value: (paste the Railway token)

Now every push to `main` will auto-deploy via `.github/workflows/cd-deploy.yml`.

---

## Step 6 — Verify

Visit the Railway-provided URL for your `web` service. The app should load and connect to the API.

To check logs:
```bash
railway logs --service api
railway logs --service web
```

---

## Environment Variables Summary

### API service
```
DATABASE_URL=postgresql+asyncpg://...
ANTHROPIC_API_KEY=sk-ant-...
PORT=8000
```

### Web service
```
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
PORT=3000
NODE_ENV=production
```
