"use server";

import { createDB, schema } from "@repo/database";

export async function fetchMeterReadings(meterId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const readings = await db.query.meterReadings.findMany({
			where: (r, { eq }) => eq(r.meterId, meterId),
			orderBy: (r, { asc }) => [asc(r.readingDate)],
		});

		return readings || [];
	} catch (error) {
		console.error("Failed to fetch meter readings:", error);
		return [];
	}
}

export async function createMeterReading(data: {
	meterId: string;
	readingDate: string;
	value: number;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const readingDate = data.readingDate.trim();
		if (!readingDate) return { error: "Reading date is required" };

		const value = Number(data.value);
		if (Number.isNaN(value) || value < 0) {
			return { error: "Value must be a non-negative number" };
		}

		const [existing, duplicate, meter] = await Promise.all([
			db.query.meterReadings.findMany({
				where: (r, { eq }) => eq(r.meterId, data.meterId),
				orderBy: (r, { desc }) => [desc(r.readingDate)],
				limit: 1,
			}),
			db.query.meterReadings.findFirst({
				where: (r, { and, eq }) =>
					and(
						eq(r.meterId, data.meterId),
						eq(r.readingDate, readingDate),
					),
			}),
			db.query.meters.findFirst({
				where: (m, { eq }) => eq(m.id, data.meterId),
			}),
		]);

		if (duplicate) {
			return { error: "A reading for this date already exists for this meter." };
		}

		const lastReading = existing[0];
		const previousValue = lastReading
			? lastReading.value
			: meter?.initialReading ?? 0;
		if (value < previousValue) {
			return {
				error:
					"Value must be greater than or equal to the previous reading.",
			};
		}

		const result = await db
			.insert(schema.meterReadings)
			.values({
				meterId: data.meterId,
				readingDate,
				value,
			})
			.returning();

		return { success: true, result };
	} catch (error) {
		console.error("Failed to create meter reading:", error);
		return { error: "Failed to add reading" };
	}
}

export async function createMeterReadingsFromTemplate(data: {
	templateId: string;
	readingDate: string;
	values: Array<{ meterId: string; value: number }>;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const readingDate = data.readingDate.trim();
		if (!readingDate) return { error: "Reading date is required" };

		// Fetch template and verify it exists
		const template = await db.query.meterReadingTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, data.templateId),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Fetch template lines
		const templateLines = await db.query.meterReadingTemplateLines.findMany({
			where: (l, { eq }) => eq(l.templateId, data.templateId),
		});

		// Fetch all meters for validation
		const meters = await db.query.meters.findMany({
			where: (m, { eq }) => eq(m.addressId, template.addressId),
		});

		const metersById = new Map(meters.map((m) => [m.id, m]));
		const templateMeterIds = new Set(templateLines.map((l) => l.meterId));

		// Validate that all submitted values match template meters
		const errors: string[] = [];

		for (const value of data.values) {
			// Check if meter is in template
			if (!templateMeterIds.has(value.meterId)) {
				const meter = metersById.get(value.meterId);
				errors.push(
					`Meter "${meter?.name || value.meterId}" is not in this template`
				);
				continue;
			}

			// Validate value
			if (Number.isNaN(value.value) || value.value < 0) {
				const meter = metersById.get(value.meterId);
				errors.push(`${meter?.name || value.meterId}: Value must be non-negative`);
				continue;
			}

			// Check for duplicate reading
			const existing = await db.query.meterReadings.findFirst({
				where: (r, { and, eq }) =>
					and(
						eq(r.meterId, value.meterId),
						eq(r.readingDate, readingDate),
					),
			});

			if (existing) {
				const meter = metersById.get(value.meterId);
				errors.push(
					`${meter?.name || value.meterId}: Reading for this date already exists`
				);
				continue;
			}

			// Check monotonic value
			const lastReadings = await db.query.meterReadings.findMany({
				where: (r, { eq }) => eq(r.meterId, value.meterId),
				orderBy: (r, { desc }) => [desc(r.readingDate)],
				limit: 1,
			});

			const meter = metersById.get(value.meterId);
			const previousValue = lastReadings[0]
				? lastReadings[0].value
				: meter?.initialReading ?? 0;

			if (value.value < previousValue) {
				errors.push(
					`${meter?.name || value.meterId}: Value must be >= last reading (${previousValue})`
				);
			}
		}

		if (errors.length > 0) {
			return {
				error: "Validation failed",
				details: errors,
			};
		}

		// Insert all readings
		const readings = data.values.map((v) => ({
			meterId: v.meterId,
			readingDate,
			value: v.value,
		}));

		await db.insert(schema.meterReadings).values(readings);

		return { success: true as const };
	} catch (error) {
		console.error("Failed to create meter readings from template:", error);
		return { error: "Failed to add readings" };
	}
}
