"use server";

import { createDB } from "@repo/database";
// import { countries } from "@repo/database/schema/auth.sql";

export async function fetchCountries() {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const countries = await db.query.countries.findMany();

		return countries || [];
	} catch (error) {
		console.error("Failed to fetch countries:", error);
		return [];
	}
}
