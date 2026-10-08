# Session Progress Log

## Current State

**Last Updated:** 2026-10-08
**Active Feature:** none yet (next: feat-002 Vitest)

## Status

### What's Done

- [x] Harness scaffolded at repo root (CLAUDE.md, feature_list.json, progress.md, session-handoff.md, init.sh)
- [x] `init.sh` rewritten to mirror CI: `pnpm install --frozen-lockfile`, `pnpm lint:ci`, `pnpm check-types`; `--full` adds `pnpm build:web`
- [x] feat-001 green baseline (cold timings in devcontainer: fast ~10s, full ~30s)
- [x] `CLAUDE.md` trimmed to a map with repo map and invariants

### What's Next

1. Order: feat-002 Vitest, feat-003 Overview totals, feat-004 Overview charts (recharts via shadcn, approved). Commit harness files once the user confirms what to include

## Blockers / Risks

- [ ] Host `node_modules` was a stale devcontainer install; run `./init.sh` inside the devcontainer (`/workspace`), not on the host (host pnpm asks to purge modules).
- [ ] No test runner exists; verification is lint + types + build only.
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
