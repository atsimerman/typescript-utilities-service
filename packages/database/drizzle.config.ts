import { defineConfig } from "drizzle-kit";

const pgURL = process.env.DATABASE_URL ?? "";

export default defineConfig({
	out: "./drizzle/",
	strict: true,
	schema: "./src/schema/*.sql.ts",
	verbose: true,
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: pgURL,
	},
});
