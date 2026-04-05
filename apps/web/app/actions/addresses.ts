"use server";

import { createDB } from "@repo/database";

export async function fetchAddresses() {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const addresses = await db.query.addresses.findMany();

		return addresses || [];
	} catch (error) {
		console.error("Failed to fetch addresses:", error);
		return [];
	}
}
