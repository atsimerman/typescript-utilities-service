# CLAUDE.md

Short map for agents. pnpm + Turborepo monorepo; one Next.js app.

## Startup Workflow

1. `pwd`, then read `progress.md` (and `session-handoff.md` if non-empty)
2. Run `./init.sh` (fast, ~10s cold). Fix a failing baseline before any new scope.
3. Read `feature_list.json`
4. One feature at a time: pick **ONE** unfinished feature and stay in scope (its `scope` field)

Node/pnpm run in the devcontainer: the repo is mounted at `/workspace` (`docker exec -w /workspace <container> ./init.sh`).

## Definition of Done

- Target behavior implemented, only inside the feature's `scope`
- `./init.sh` passes (use `./init.sh --full` if you touched routes, config, env or deps)
- Evidence (command + result) written to `feature_list.json` and `progress.md`

## End of Session

1. Update `progress.md` and the feature's `status`/`evidence` in `feature_list.json`
2. Fill `session-handoff.md` with blockers and the next step
3. Commit once verification is green; leave the repo runnable via `./init.sh`

## Repo map

- `apps/web` — Next.js dashboard (App Router). Pages in `app/(app)/`, server actions in `app/actions/`, helpers in `lib/`, components in `components/`
- `apps/web/CLAUDE.md` has app-local rules
- `packages/database` — Drizzle schema + client (`src/schema/`)
- `packages/auth` — better-auth setup
- `packages/ui` — shared shadcn-based components
- `packages/biome-config`, `packages/typescript-config` — shared configs
- Single workspace: `pnpm --filter web check-types` (also `build`, `dev`)

## Invariants

- Do **not** use `pnpm lint` for verification: it runs `biome check --write` and edits files. Use `pnpm lint:ci` (read-only, what CI runs). Biome uses tabs; `biome ci .` also checks JSON like `feature_list.json`.
- No test runner exists yet; verification is `lint:ci` + `check-types` (+ `build:web` with `--full`).
- `next build` needs `DATABASE_URL` set (a dummy value is fine; `init.sh` sets one). Never commit `.env`.
- Biome ignores CSS, `migrations/` and `drizzle/` (see `biome.json`).

## Deeper docs

`README.md`, `apps/web/README.md`, `DEPLOYMENT.md`, `.github/workflows/ci.yml`
