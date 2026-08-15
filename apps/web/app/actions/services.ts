"use server";

import { getDB } from "@repo/database";

export async function fetchServices() {
	try {
		const db = getDB();

		const services = await db.query.services.findMany({
			orderBy: (services, { asc }) => [asc(services.name)],
		});

		return services || [];
	} catch (error) {
		console.error("Failed to fetch services:", error);
		return [];
	}
}
