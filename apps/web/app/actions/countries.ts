"use server";

import { getDB } from "@repo/database";
// import { countries } from "@repo/database/schema/auth.sql";

export async function fetchCountries() {
	try {
		const db = getDB();

		const countries = await db.query.countries.findMany();

		return countries || [];
	} catch (error) {
		console.error("Failed to fetch countries:", error);
		return [];
	}
}
