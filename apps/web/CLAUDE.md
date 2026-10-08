# apps/web

Next.js (App Router) dashboard. Read the root `CLAUDE.md` first; this file only adds local rules.

## Layout

- `app/(app)/` authenticated pages (`summary`, `ledger`, `meters`, `services`, `settings`); `app/(auth)/` sign-in flows; `app/api/auth/` better-auth route
- `app/actions/` server actions, the only place that talks to `@repo/database`
- `lib/` pure helpers (`monthly-summary.ts`, `format-money.ts`, `format-date.ts`, `ledger-period.ts`). Keep them free of React and DB imports so they stay unit-testable
- `components/` app-level components; generic primitives live in `packages/ui` (import as `@repo/ui/components/...`)

## Rules

- Money is stored as integer minor units; format with `formatMinorAmount`, never `toFixed` on money
- Pages read data through existing `app/actions/*` fetchers; don't query the DB from components
- The first address from `fetchAddresses()` is the "active" address (see `summary/page.tsx`)

## Verify

- From the root: `./init.sh` (add `--full` for route/config changes)
- Just this app: `pnpm --filter web check-types`, `pnpm --filter web build` (needs `DATABASE_URL`, a dummy is fine)
- Don't run `pnpm --filter web lint`: it is `biome check --write` and edits files. Use `pnpm lint:ci` from the root
