"use server";

import { getDB, schema } from "@repo/database";

export async function createAddress(data: {
	label: string;
	street: string;
	city: string;
	zipCode: string;
	countryId: string;
	currencyId: string;
	userId: string;
}) {
	try {
		const db = getDB();

		const result = await db
			.insert(schema.addresses)
			.values({
				label: data.label,
				street: data.street,
				city: data.city,
				zipCode: data.zipCode,
				countryId: data.countryId,
				userId: data.userId,
				currencyId: data.currencyId,
				active: true,
			})
			.returning();

		return { success: true, result };
	} catch (error) {
		console.error("Failed to create address:", error);
		return { error: "Failed to create address" };
	}
}
