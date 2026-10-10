import { getDB } from "@repo/database";
import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

const withProtocol = (host: string) =>
	/^https?:\/\//.test(host) ? host : `https://${host}`;

/**
 * Every Vercel deployment gets its own hostname, so the base URL has to be
 * resolved at runtime. Pinning it to a single domain would make Better Auth
 * generate callback and reset-password links pointing at production from every
 * preview deployment, and fail their origin checks.
 */
const resolveBaseURL = (): string => {
	// Explicit wins — but set it per-environment on Vercel, never globally, or
	// preview deployments go back to advertising the production domain.
	if (process.env.BETTER_AUTH_URL) {
		return process.env.BETTER_AUTH_URL;
	}

	// In production VERCEL_URL is the immutable per-deployment hostname, not the
	// domain users actually visit, so the stable project URL is preferred there.
	if (
		process.env.VERCEL_ENV === "production" &&
		process.env.VERCEL_PROJECT_PRODUCTION_URL
	) {
		return withProtocol(process.env.VERCEL_PROJECT_PRODUCTION_URL);
	}

	if (process.env.VERCEL_URL) {
		return withProtocol(process.env.VERCEL_URL);
	}

	// Falling back to localhost on Vercel would silently break auth with no error
	// at build or boot, which is exactly the failure this function exists to stop.
	if (process.env.VERCEL) {
		throw new Error(
			"Running on Vercel but no base URL could be resolved. Set BETTER_AUTH_URL.",
		);
	}

	return process.env.PORTLESS_URL ?? "http://localhost:3000";
};

/**
 * The deployment's own origins are always trusted; BETTER_AUTH_TRUSTED_ORIGINS
 * is for anything external. Deriving the Vercel origins explicitly avoids a
 * `https://*.vercel.app` wildcard, which would trust every deployment on the
 * platform, not just yours.
 */
const resolveTrustedOrigins = (baseURL: string): string[] => {
	const vercelOrigins = [
		process.env.VERCEL_PROJECT_PRODUCTION_URL,
		process.env.VERCEL_URL,
		process.env.VERCEL_BRANCH_URL,
	]
		.filter((host): host is string => !!host)
		.map(withProtocol);

	const origins = [
		baseURL,
		...vercelOrigins,
		...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
		process.env.PORTLESS_URL,
	]
		.map((origin) => origin?.trim())
		.filter((origin): origin is string => !!origin);

	return [...new Set(origins)];
};

export default function createAuth(): Auth<BetterAuthOptions> {
	const db = getDB();
	const baseURL = resolveBaseURL();

	return betterAuth({
		advanced: {
			database: {
				generateId: "uuid",
			},
		},
		baseURL,
		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
		}),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [admin()],
		secret: process.env.BETTER_AUTH_SECRET,
		trustedOrigins: resolveTrustedOrigins(baseURL),
		user: {
			// No email sender is configured, so emails are never verified. For an
			// unverified user, better-auth then updates the email immediately. If a
			// user's email ever becomes verified, changing it needs
			// emailVerification.sendVerificationEmail (and a mail provider).
			changeEmail: {
				enabled: true,
				updateEmailWithoutVerification: true,
			},
		},
	}) as unknown as Auth<BetterAuthOptions>;
}
