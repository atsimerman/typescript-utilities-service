# `@repo/biome-config`

Shared [Biome](https://biomejs.dev) configs for this monorepo.

- `base.json` — base rules for any TypeScript package
- `next.json` — extends `base` with Next.js-specific rules
- `react-internal.json` — extends `base` for internal React component packages

## Usage

```json
{
	"extends": ["@repo/biome-config/base"]
}
```
