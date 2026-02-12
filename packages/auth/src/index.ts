import { createDB } from "@repo/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

export default function createAuth() {
	const db = createDB({ pgUrl: process.env.DATABASE_URL ?? "" });

	return betterAuth({
		advanced: {
			database: {
				generateId: "uuid",
			},
		},
		baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
		}),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [admin()],
		secret: process.env.BETTER_AUTH_SECRET,
		trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [],
	});
}
