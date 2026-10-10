# Session Progress Log

## Current State

**Last Updated:** 2026-10-10
**Active Feature:** none yet (feat-003 done; next: feat-004 Overview charts)

## Status

### What's Done

- [x] Harness scaffolded at repo root (CLAUDE.md, feature_list.json, progress.md, session-handoff.md, init.sh)
- [x] `init.sh` rewritten to mirror CI: `pnpm install --frozen-lockfile`, `pnpm lint:ci`, `pnpm check-types`; `--full` adds `pnpm build:web`
- [x] feat-001 green baseline (cold timings in devcontainer: fast ~10s, full ~30s)
- [x] `CLAUDE.md` trimmed to a map with repo map and invariants
- [x] feat-002 Vitest in apps/web: 22 tests (format-money, format-date, monthly-summary); `pnpm test` wired into root, turbo.json and init.sh
- [x] feat-003 Overview totals: `lib/overview.ts` (+tests), `components/overview-stat-card.tsx`, `app/(app)/page.tsx` shows balance, charged/paid this month, paid all time for the first address

### What's Next

1. feat-004 Overview charts (recharts via shadcn, approved). Commit harness files once the user confirms what to include

## Blockers / Risks

- [ ] Host `node_modules` was a stale devcontainer install; run `./init.sh` inside the devcontainer (`/workspace`), not on the host (host pnpm asks to purge modules).
- [ ] Overview page not yet viewed in a browser with real data.
- [ ] Tests cover only apps/web/lib pure helpers; no component/page tests.
- [ ] `pnpm approve-builds` warning: esbuild build scripts are ignored (tests still run).
- [ ] Root `pnpm lint` is `biome check --write` (mutates files); `init.sh` deliberately uses `lint:ci`.
- [ ] `dev` scripts hardcode `/workspace/.env`; README mentions `AUTH_SECRET` but `.env.example` uses `BETTER_AUTH_SECRET`.

## Decisions Made

- **Verification mirrors CI**: lint:ci, check-types, build:web. Build only in `--full` to keep the default fast.

## Files Modified This Session

- `init.sh`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`

## Evidence of Completion

- [x] `./init.sh` (TURBO_FORCE=true, devcontainer): install 0s, lint:ci 1s, check-types 9s, passed
- [x] `./init.sh --full`: adds build:web 20s, passed
- [x] `validate-harness.mjs`: 100/100 (static check only)

## Notes for Next Session

Run `docker exec -w /workspace <devcontainer> ./init.sh`. Container id used this session: 64bd785b7cef (may change).
