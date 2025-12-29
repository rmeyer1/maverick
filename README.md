# Maverick

Reddit market radar MVP.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Then fill in your Supabase values in `.env.local`.

3. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Auth flow

- Visit `/login` and request a magic link.
- Authenticated users are redirected to `/app`.
- Unauthenticated users are redirected to `/login`.

## Health check

`GET /health` returns `{ ok: true }`.
