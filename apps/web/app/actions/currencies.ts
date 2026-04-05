"use server";

import { createDB } from "@repo/database";

export async function fetchCurrencies() {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const currencies = await db.query.currencies.findMany();

		return currencies || [];
	} catch (error) {
		console.error("Failed to fetch currencies:", error);
		return [];
	}
}
