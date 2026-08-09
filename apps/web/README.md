# `web`

The Utilities Service app — a Next.js dashboard for managing flat services, meter readings, and the monthly billing ledger. Auth is handled by `better-auth` / `@better-auth-ui`, data by `@repo/database` (Drizzle).

## Getting started

From the repo root:

```bash
pnpm install
pnpm dev
```

Or just this app:

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires a `.env` at the repo root (see `.env.example`) with `DATABASE_URL` and auth settings.
