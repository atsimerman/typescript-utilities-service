#!/usr/bin/env bash
set -euo pipefail

# Remove build artifacts and dependency trees, keeping the pnpm store intact.
find . -path ./.pnpm-store -prune -o \
	\( -name node_modules -o -name .next -o -name .turbo -o -name dist -o -name cache \) \
	-type d -prune -exec rm -rf {} +
