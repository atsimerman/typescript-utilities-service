// Pulls the `@better-auth-ui` plugin registration (see the module it imports)
// into this app's TypeScript program. Module augmentation applies per program,
// not per file, so this single import widens `useAuth().plugins` everywhere in
// `apps/web` — including inside the vendored `@repo/ui` auth components, which
// must stay untouched so they can be re-synced from upstream.
//
// tsconfig `include: ["**/*.ts"]` picks this file up; nothing imports it at
// runtime, so it contributes no JavaScript.
import "@repo/ui/lib/auth/auth-plugin";
