"use server";

import { createDB, schema } from "@repo/database";

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
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

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
