#!/bin/bash
# Standard startup + verification path. Mirrors .github/workflows/ci.yml.
#   ./init.sh          fast default: install, lint:ci (read-only), check-types, test
#   ./init.sh --full   fast default + `pnpm build:web` (next build)
set -e

cd "$(dirname "$0")"

FULL=0
[ "$1" = "--full" ] && FULL=1

# next build evaluates lib/auth.ts, which only needs DATABASE_URL to be set
# (no connection is made). Same dummy value CI uses.
export DATABASE_URL="${DATABASE_URL:-postgres://ci:ci@localhost:5432/ci}"

step() {
  echo ""
  echo "=== $1 ==="
  STEP_START=$SECONDS
}
done_step() { echo "--- done in $((SECONDS - STEP_START))s"; }

echo "=== Harness Initialization (mode: $([ $FULL = 1 ] && echo full || echo fast)) ==="

step "pnpm install --frozen-lockfile"
pnpm install --frozen-lockfile
done_step

# Root `pnpm lint` runs `biome check --write` and mutates files; use the
# read-only CI variant for verification.
step "pnpm lint:ci (biome ci .)"
pnpm lint:ci
done_step

step "pnpm check-types"
pnpm check-types
done_step

step "pnpm test (vitest)"
pnpm test
done_step

if [ $FULL = 1 ]; then
  step "pnpm build:web"
  pnpm build:web
  done_step
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run ./init.sh (use --full if you touched build/config) before claiming done"
