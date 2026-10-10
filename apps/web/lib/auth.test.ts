import { afterEach, describe, expect, it, vi } from "vitest";

// Smoke test for the better-auth upgrade: the config in @repo/auth must still
// build and expose the endpoints the app and UI rely on. No DB connection is
// made at construction time, so a dummy URL is enough.
describe("createAuth", () => {
	afterEach(() => vi.unstubAllEnvs());

	it("builds and exposes the email/password, admin and account endpoints", async () => {
		vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost:5432/test");
		vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));
		vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

		const { default: createAuth } = await import("@repo/auth");
		const auth = createAuth();

		expect(typeof auth.handler).toBe("function");
		for (const endpoint of [
			"signInEmail",
			"signUpEmail",
			"getSession",
			"signOut",
			"listUsers", // admin plugin
			"unlinkAccount",
			"accountInfo",
		]) {
			expect(auth.api, endpoint).toHaveProperty(endpoint);
		}
	});
});
