import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export { eq } from "drizzle-orm";

import { schema } from "./schema/index.js";

const initDB = (pgUrl: string) =>
	drizzle(
		new Pool({
			connectionString: pgUrl,
			// A serverless function instance handles one request at a time, so it
			// needs very few connections. Keeping the cap low is what stops a burst
			// of concurrent instances from exhausting the Postgres connection limit.
			max: 3,
			idleTimeoutMillis: 10_000,
			connectionTimeoutMillis: 10_000,
		}),
		{
			schema,
		},
	);

export type PostgresDB = ReturnType<typeof initDB>;

// Cached on globalThis rather than in a module binding: both Next's dev HMR and
// serverless warm starts re-evaluate modules while reusing the process, and a
// module-scoped pool would be abandoned — still holding its connections — on
// every re-evaluation.
const globalForDB = globalThis as typeof globalThis & {
	__repoDB?: PostgresDB;
};

/**
 * The shared database handle. Lazily created on first use and reused for the
 * lifetime of the process — never call this per request or per action.
 *
 * @throws if `DATABASE_URL` is not set.
 */
export const getDB = (): PostgresDB => {
	if (globalForDB.__repoDB) {
		return globalForDB.__repoDB;
	}

	const pgUrl = process.env.DATABASE_URL;

	if (!pgUrl) {
		throw new Error("DATABASE_URL is not set");
	}

	globalForDB.__repoDB = initDB(pgUrl);

	return globalForDB.__repoDB;
};

export { schema };
