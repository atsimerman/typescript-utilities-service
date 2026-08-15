"use server";

import { getDB } from "@repo/database";

export async function fetchCurrencies() {
	try {
		const db = getDB();

		const currencies = await db.query.currencies.findMany();

		return currencies || [];
	} catch (error) {
		console.error("Failed to fetch currencies:", error);
		return [];
	}
}
