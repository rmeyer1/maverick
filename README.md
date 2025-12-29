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
For job tracking, also set `SUPABASE_SERVICE_ROLE_KEY` (server-side only) in both web and worker env files.

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

## Redis (Upstash)

Use Upstash Redis for BullMQ in serverless environments.

1. Create a Redis database in Upstash.
2. Copy the TLS connection string (starts with `rediss://`).
3. Set environment variables in both `apps/web/.env.local` and `apps/worker/.env.local`:

```bash
REDIS_URL=rediss://:password@host:port
BULLMQ_PREFIX=reddit-radar
```

Serverless note: API routes should only enqueue jobs. Long-lived workers connect from `apps/worker`.

## Worker

The worker process runs BullMQ processors for ingest, extract, and aggregate jobs.

```bash
cp apps/worker/.env.example apps/worker/.env.local
npm run dev:worker
```

## Reddit fetcher

Use `POST /api/reddit/thread` with `{ "url": "https://www.reddit.com/r/.../comments/..." }`.
The response includes a normalized thread and flattened comments list.

## Auth flow

- Visit `/login` and request a magic link.
- Authenticated users are redirected to `/app`.
- Unauthenticated users are redirected to `/login`.

## Health check

`GET /health` returns `{ ok: true }`.
