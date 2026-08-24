#!/usr/bin/env bash
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ]; then
	echo "Production build — running database migrations..."
	DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" \
		pnpm --filter @repo/database exec drizzle-kit migrate
else
	echo "Non-production build (${VERCEL_ENV:-local}) — skipping migrations."
fi

pnpm build:web