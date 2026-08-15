"use server";

import { getDB, schema } from "@repo/database";

type ServiceType = "group" | "fixed" | "metered";

export async function createService(data: {
	name: string;
	slug: string;
	type: ServiceType;
	parentId?: string | null;
}) {
	try {
		const db = getDB();

		const trimmedName = data.name.trim();
		const trimmedSlug = data.slug.trim();

		if (!trimmedName || !trimmedSlug) {
			return { error: "Name and slug are required" };
		}

		const result = await db
			.insert(schema.services)
			.values({
				name: trimmedName,
				slug: trimmedSlug,
				type: data.type,
				parentId: data.parentId || null,
			})
			.returning();

		return { success: true, result };
	} catch (error) {
		console.error("Failed to create service:", error);
		return { error: "Failed to create service" };
	}
}
