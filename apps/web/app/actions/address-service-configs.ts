"use server";

import { createDB, schema } from "@repo/database";

function parseDate(d: Date | string): Date {
	return typeof d === "string" ? new Date(d) : d;
}

function rangesOverlap(
	aFrom: Date | string,
	aTo: Date | string | null,
	bFrom: Date | string,
	bTo: Date | string | null,
): boolean {
	const aEnd = aTo ? parseDate(aTo).getTime() : Number.POSITIVE_INFINITY;
	const bEnd = bTo ? parseDate(bTo).getTime() : Number.POSITIVE_INFINITY;
	const aStart = parseDate(aFrom).getTime();
	const bStart = parseDate(bFrom).getTime();
	return aStart < bEnd && aEnd > bStart;
}

export async function createAddressServiceConfig(data: {
	addressId: string;
	serviceId: string;
	activeFrom: string;
	activeTo?: string | null;
	fixedPrice?: number | null;
	pricePerUnit?: number | null;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const activeFrom = data.activeFrom.trim();
		if (!activeFrom) return { error: "Active from is required" };

		const existing = await db.query.addressServiceConfigs.findMany({
			where: (cfg, { and, eq }) =>
				and(
					eq(cfg.addressId, data.addressId),
					eq(cfg.serviceId, data.serviceId),
				),
		});

		const newFrom = new Date(activeFrom);
		const newTo = data.activeTo?.trim() ? new Date(data.activeTo) : null;

		if (newTo && newFrom > newTo) {
			return { error: "Active from must be on or before active to" };
		}

		for (const row of existing) {
			if (
				rangesOverlap(newFrom, newTo, row.activeFrom, row.activeTo)
			) {
				return {
					error:
						"Pricing periods for the same service and address cannot overlap.",
				};
			}
		}

		const result = await db
			.insert(schema.addressServiceConfigs)
			.values({
				addressId: data.addressId,
				serviceId: data.serviceId,
				activeFrom,
				activeTo: data.activeTo?.trim() || null,
				fixedPrice: data.fixedPrice ?? null,
				pricePerUnit: data.pricePerUnit ?? null,
			})
			.returning();

		return { success: true, result };
	} catch (error) {
		console.error("Failed to create address service config:", error);
		return { error: "Failed to create pricing version" };
	}
}

export async function fetchAddressServiceConfigs(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const [configs, services] = await Promise.all([
			db.query.addressServiceConfigs.findMany({
				where: (cfg, { eq }) => eq(cfg.addressId, addressId),
				orderBy: (cfg, { asc }) => [asc(cfg.activeFrom)],
			}),
			db.query.services.findMany(),
		]);

		const servicesById = new Map(services.map((service) => [service.id, service]));

		const withServices = (configs || []).map((config) => ({
			...config,
			service: servicesById.get(config.serviceId) ?? null,
		}));

		return withServices;
	} catch (error) {
		console.error("Failed to fetch address service configs:", error);
		return [];
	}
}

