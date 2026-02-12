import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema/index.js";

export const createDB = ({ pgUrl }: { pgUrl: string }) =>
	drizzle(pgUrl, {
		schema,
	});

export type PostgresDB = ReturnType<typeof createDB>;

export { schema };
