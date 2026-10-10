# Session Progress Log

## Current State

**Last Updated:** 2026-10-10
**Active Feature:** feat-009 @better-auth-ui 1.7 (on feature/better-auth-ui-1-7, awaiting user visual check; then merge into feature/better-auth-upgrade and open the single PR to main)

## Status

### What's Done

- [x] Harness scaffolded at repo root (CLAUDE.md, feature_list.json, progress.md, session-handoff.md, init.sh)
- [x] `init.sh` rewritten to mirror CI: `pnpm install --frozen-lockfile`, `pnpm lint:ci`, `pnpm check-types`; `--full` adds `pnpm build:web`
- [x] feat-001 green baseline (cold timings in devcontainer: fast ~10s, full ~30s)
- [x] `CLAUDE.md` trimmed to a map with repo map and invariants
- [x] feat-002 Vitest in apps/web: 22 tests (format-money, format-date, monthly-summary); `pnpm test` wired into root, turbo.json and init.sh
- [x] feat-003 Overview totals: `lib/overview.ts` (+tests), `components/overview-stat-card.tsx`, `app/(app)/page.tsx` shows balance, charged/paid this month, paid all time for the first address
- [x] feat-004 Overview charts: shadcn `chart.tsx` in packages/ui (+recharts 3.8.0 in ui and web), `components/overview-charts.tsx` (stacked charges bar + balance area, 6 months), `chartSeries()` in lib/overview.ts
- [x] feat-005 replaced the balance chart with Utilities by service (line chart for the 4 most expensive services, rent excluded; `utilitiesSeries()` in lib/overview.ts)
- [x] feat-006 (done; user verified local sign-in): better-auth family at 1.7.7, UI lib kept at 1.6.43; see feature_list.json evidence
- [x] feat-007 vendored UI code (packages/ui/src/{components,lib,hooks}) excluded from Biome
- [x] feat-008 shadcn components synced from the registry (named list, not --all); user verified visually

### What's Next

1. Optional before prod deploy: on Neon run `select provider_id, account_id, count(*) from accounts group by 1,2 having count(*)>1;` (expect 0 rows; only credential accounts exist)
2. Then feat-008 (sync shadcn components, named list not --all), then feat-009 (@better-auth-ui to 1.7.x, force-update approved); then one PR feature/better-auth-upgrade -> main

## Blockers / Risks

- [ ] Host `node_modules` was a stale devcontainer install; run `./init.sh` inside the devcontainer (`/workspace`), not on the host (host pnpm asks to purge modules).
- [ ] Overview charts (incl. utilities-by-service) not yet viewed in a browser (light/dark, tooltips).
- [ ] chart.tsx is stock shadcn with 3 scoped `biome-ignore` comments and `cn` import pointed at `@repo/ui/lib/utils` (registry used a bogus `cn` package). Re-adding via `shadcn add chart` would prompt to overwrite card.tsx and add that `cn` dep.
- [ ] Tests cover only apps/web/lib pure helpers; no component/page tests.
- [ ] `pnpm approve-builds` warning: esbuild build scripts are ignored (tests still run).
- [ ] Root `pnpm lint` is `biome check --write` (mutates files); `init.sh` deliberately uses `lint:ci`.
- [ ] `dev` scripts hardcode `/workspace/.env`; README mentions `AUTH_SECRET` but `.env.example` uses `BETTER_AUTH_SECRET`.

## Decisions Made

- **Branching for the better-auth upgrade**: one integration branch `feature/better-auth-upgrade` (off main) collects the task branches. Each task gets its own `feature/...` branch off the integration branch and is merged back with `--no-ff`; only the integration branch goes to main as one PR. feat-006 = `feature/better-auth-1-7` (merged), feat-007 and feat-008 next.
- **Verification mirrors CI**: lint:ci, check-types, build:web. Build only in `--full` to keep the default fast.

## Files Modified This Session

- `init.sh`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`

## Evidence of Completion

- [x] `./init.sh` (TURBO_FORCE=true, devcontainer): install 0s, lint:ci 1s, check-types 9s, passed
- [x] `./init.sh --full`: adds build:web 20s, passed
- [x] `validate-harness.mjs`: 100/100 (static check only)

## Notes for Next Session

Run `docker exec -w /workspace <devcontainer> ./init.sh`. Container id used this session: 64bd785b7cef (may change).
