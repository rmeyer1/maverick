# Maverick

Reddit market radar MVP.

## Monorepo layout

- `apps/web` — Next.js app + API routes
- `apps/worker` — background worker process
- `packages/shared` — shared utilities and types
- `packages/db` — database helpers (placeholder)
- `packages/jobs` — job constants (placeholder)

## Local setup

1. Install dependencies (root):

```bash
npm install
```

2. Configure environment variables for the web app:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Then fill in your Supabase values in `apps/web/.env.local`.

3. Start development:

```bash
npm run dev
```

This runs web + worker in parallel. You can also run them individually:

```bash
npm run dev:web
npm run dev:worker
```

Open http://localhost:3000.

## Auth flow

- Visit `/login` and request a magic link.
- Authenticated users are redirected to `/app`.
- Unauthenticated users are redirected to `/login`.

## Health check

`GET /health` returns `{ ok: true }`.
