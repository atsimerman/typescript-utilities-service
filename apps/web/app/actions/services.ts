"use server";

import { createDB } from "@repo/database";

export async function fetchServices() {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const services = await db.query.services.findMany({
			orderBy: (services, { asc }) => [asc(services.name)],
		});

		return services || [];
	} catch (error) {
		console.error("Failed to fetch services:", error);
		return [];
	}
}

