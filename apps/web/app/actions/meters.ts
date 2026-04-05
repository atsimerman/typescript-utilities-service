"use server";

import { createDB, schema } from "@repo/database";

export async function fetchMeters(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const [meters, services] = await Promise.all([
			db.query.meters.findMany({
				where: (m, { eq }) => eq(m.addressId, addressId),
				orderBy: (m, { asc }) => [asc(m.name)],
			}),
			db.query.services.findMany(),
		]);

		const servicesById = new Map(services.map((s) => [s.id, s]));

		return (meters || []).map((meter) => ({
			...meter,
			service: servicesById.get(meter.serviceId) ?? null,
		}));
	} catch (error) {
		console.error("Failed to fetch meters:", error);
		return [];
	}
}

export async function createMeter(data: {
	addressId: string;
	serviceId: string;
	name: string;
	unit: string;
	initialReading: number;
	installedAt: string;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const name = data.name.trim();
		const unit = data.unit.trim();
		if (!name) return { error: "Meter name is required" };
		if (!unit) return { error: "Unit is required" };

		const initialReading = Number(data.initialReading);
		if (Number.isNaN(initialReading) || initialReading < 0) {
			return { error: "Initial reading must be a non-negative number" };
		}

		const installedAt = data.installedAt.trim();
		if (!installedAt) return { error: "Installed at date is required" };

		const result = await db
			.insert(schema.meters)
			.values({
				addressId: data.addressId,
				serviceId: data.serviceId,
				name,
				unit,
				initialReading,
				installedAt,
				active: true,
			})
			.returning();

		return { success: true, result };
	} catch (error) {
		console.error("Failed to create meter:", error);
		return { error: "Failed to create meter" };
	}
}
