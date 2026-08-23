import type { AuthPlugin } from "@better-auth-ui/react";

/**
 * `@better-auth-ui/core` types `AuthConfig.plugins` as its own `AuthPlugin`,
 * which is a registry lookup:
 *
 *     type AuthPlugin = [keyof AuthPluginRegister] extends [never]
 *       ? AuthPluginBase
 *       : ...
 *
 * `AuthPluginRegister` ships empty, so until a UI package registers its plugin
 * shape the type collapses to the framework-agnostic `AuthPluginBase` and every
 * React-side slot — `views`, `fallbackViews`, `cardOverrides`, `settingsTabs`,
 * `authButtons`, `captchaComponent`, `accountCards`, `securityCards`,
 * `userMenuItems` — disappears from `useAuth().plugins`.
 *
 * Published UI packages such as `@better-auth-ui/heroui` do this in their own
 * entry point. These components are vendored into this package instead, so the
 * registration has to live here.
 *
 * Import this module for its side effect from any component that reads plugin
 * slots off `useAuth()`.
 */
declare module "@better-auth-ui/core" {
	interface AuthPluginRegister {
		repoUi: AuthPlugin;
	}
}
