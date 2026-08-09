# Utilities Service

A monorepo for managing flat services, meter readings, and monthly billing — versioned service pricing, meter reading history, and a single-entry ledger of charges and payments.

## Apps and packages

- `apps/web` — the Next.js dashboard ([details](apps/web/README.md))
- `packages/auth` — `better-auth` setup shared by the app
- `packages/database` — Drizzle schema and DB client
- `packages/ui` — shared React components (shadcn-based)
- `packages/biome-config` — shared Biome lint configs
- `packages/typescript-config` — shared `tsconfig.json` bases

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET
pnpm dev               # runs the web app + drizzle studio via turbo
```

Other useful commands (run from the root, via [Turborepo](https://turborepo.dev)):

```bash
pnpm build
pnpm lint
pnpm check-types
```
