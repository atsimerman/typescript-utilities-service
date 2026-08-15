"use server";

import { getDB } from "@repo/database";

export async function fetchAddresses() {
	try {
		const db = getDB();

		const addresses = await db.query.addresses.findMany();

		return addresses || [];
	} catch (error) {
		console.error("Failed to fetch addresses:", error);
		return [];
	}
}
