"use server";

import { createDB, schema, eq } from "@repo/database";

export async function fetchMeterReadingTemplates(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const templates = await db.query.meterReadingTemplates.findMany({
			where: (t, { eq }) => eq(t.addressId, addressId),
			orderBy: (t, { asc }) => [asc(t.createdAt)],
		});

		// Fetch line count for each template
		const templatesWithCounts = await Promise.all(
			templates.map(async (t) => {
				const lines = await db.query.meterReadingTemplateLines.findMany({
					where: (l, { eq }) => eq(l.templateId, t.id),
				});
				return {
					...t,
					lineCount: lines.length,
				};
			})
		);

		return templatesWithCounts || [];
	} catch (error) {
		console.error("Failed to fetch meter reading templates:", error);
		return [];
	}
}

export async function fetchMeterReadingTemplateWithLines(templateId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return null;
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const template = await db.query.meterReadingTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, templateId),
		});

		if (!template) return null;

		const lines = await db.query.meterReadingTemplateLines.findMany({
			where: (l, { eq }) => eq(l.templateId, templateId),
			orderBy: (l, { asc }) => [asc(l.sortOrder)],
		});

		// Fetch meter details for each line
		const meters = await db.query.meters.findMany();
		const metersById = new Map(meters.map((m) => [m.id, m]));

		const linesWithMeters = lines.map((line) => ({
			...line,
			meter: metersById.get(line.meterId) ?? null,
		}));

		return {
			...template,
			lines: linesWithMeters,
		};
	} catch (error) {
		console.error("Failed to fetch meter reading template:", error);
		return null;
	}
}

export async function createMeterReadingTemplate(data: {
	addressId: string;
	name: string;
	meterIds: string[];
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const name = data.name.trim();
		if (!name) {
			return { error: "Template name is required" };
		}

		if (data.meterIds.length === 0) {
			return { error: "At least one meter must be selected" };
		}

		// Verify all meters belong to the address
		const meters = await db.query.meters.findMany({
			where: (m, { eq }) => eq(m.addressId, data.addressId),
		});

		const meterIds = new Set(meters.map((m) => m.id));
		for (const id of data.meterIds) {
			if (!meterIds.has(id)) {
				return { error: "One or more meters do not belong to this address" };
			}
		}

		// Create template and lines in transaction-like manner
		const [template] = await db
			.insert(schema.meterReadingTemplates)
			.values({
				addressId: data.addressId,
				name,
			})
			.returning();

		if (!template) {
			return { error: "Failed to create template" };
		}

		// Insert lines with sortOrder
		const lines = data.meterIds.map((meterId, index) => ({
			templateId: template.id,
			meterId,
			sortOrder: index,
		}));

		await db.insert(schema.meterReadingTemplateLines).values(lines);

		return { success: true as const, result: template };
	} catch (error) {
		console.error("Failed to create meter reading template:", error);
		return { error: "Failed to create template" };
	}
}

export async function updateMeterReadingTemplate(data: {
	id: string;
	name: string;
	meterIds: string[];
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const name = data.name.trim();
		if (!name) {
			return { error: "Template name is required" };
		}

		if (data.meterIds.length === 0) {
			return { error: "At least one meter must be selected" };
		}

		const template = await db.query.meterReadingTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, data.id),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Verify all meters belong to the address
		const meters = await db.query.meters.findMany({
			where: (m, { eq }) => eq(m.addressId, template.addressId),
		});

		const meterIds = new Set(meters.map((m) => m.id));
		for (const id of data.meterIds) {
			if (!meterIds.has(id)) {
				return { error: "One or more meters do not belong to this address" };
			}
		}

		// Update template name
		await db
			.update(schema.meterReadingTemplates)
			.set({ name })
			.where(eq(schema.meterReadingTemplates.id, data.id));

		// Delete existing lines and insert new ones
		await db
			.delete(schema.meterReadingTemplateLines)
			.where(eq(schema.meterReadingTemplateLines.templateId, data.id));

		const lines = data.meterIds.map((meterId, index) => ({
			templateId: data.id,
			meterId,
			sortOrder: index,
		}));

		await db.insert(schema.meterReadingTemplateLines).values(lines);

		return { success: true as const };
	} catch (error) {
		console.error("Failed to update meter reading template:", error);
		return { error: "Failed to update template" };
	}
}

export async function deleteMeterReadingTemplate(templateId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const template = await db.query.meterReadingTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, templateId),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Delete template (lines cascade delete via FK)
		await db
			.delete(schema.meterReadingTemplates)
			.where(eq(schema.meterReadingTemplates.id, templateId));

		return { success: true as const };
	} catch (error) {
		console.error("Failed to delete meter reading template:", error);
		return { error: "Failed to delete template" };
	}
}
