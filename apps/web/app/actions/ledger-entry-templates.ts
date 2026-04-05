"use server";

import { createDB, schema, eq } from "@repo/database";

export async function fetchLedgerEntryTemplates(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const templates = await db.query.ledgerEntryTemplates.findMany({
			where: (t, { eq }) => eq(t.addressId, addressId),
			orderBy: (t, { asc }) => [asc(t.createdAt)],
		});

		// Fetch line count for each template
		const templatesWithCounts = await Promise.all(
			templates.map(async (t) => {
				const lines = await db.query.ledgerEntryTemplateLines.findMany({
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
		console.error("Failed to fetch ledger entry templates:", error);
		return [];
	}
}

export async function fetchLedgerEntryTemplateWithLines(templateId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return null;
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const template = await db.query.ledgerEntryTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, templateId),
		});

		if (!template) return null;

		const lines = await db.query.ledgerEntryTemplateLines.findMany({
			where: (l, { eq }) => eq(l.templateId, templateId),
			orderBy: (l, { asc }) => [asc(l.sortOrder)],
		});

		// Fetch service details for each line
		const services = await db.query.services.findMany();
		const servicesById = new Map(services.map((s) => [s.id, s]));

		const linesWithServices = lines.map((line) => ({
			...line,
			service: line.serviceId ? (servicesById.get(line.serviceId) ?? null) : null,
		}));

		return {
			...template,
			lines: linesWithServices,
		};
	} catch (error) {
		console.error("Failed to fetch ledger entry template:", error);
		return null;
	}
}

export async function createLedgerEntryTemplate(data: {
	addressId: string;
	name: string;
	lines: Array<{ entryType: "charge" | "payment"; serviceId?: string }>;
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

		if (data.lines.length === 0) {
			return { error: "At least one line must be added" };
		}

		// Validate entry types and services
		const services = await db.query.services.findMany();
		const servicesById = new Map(services.map((s) => [s.id, s]));

		for (const line of data.lines) {
			if (line.entryType !== "charge" && line.entryType !== "payment") {
				return { error: "Invalid entry type" };
			}

			if (line.serviceId) {
				const svc = servicesById.get(line.serviceId);
				if (!svc) {
					return { error: "Service not found" };
				}
				if (svc.type === "group") {
					return { error: "Cannot use group services in templates" };
				}
			}
		}

		// Create template
		const [template] = await db
			.insert(schema.ledgerEntryTemplates)
			.values({
				addressId: data.addressId,
				name,
			})
			.returning();

		if (!template) {
			return { error: "Failed to create template" };
		}

		// Insert lines
		const templateLines = data.lines.map((line, index) => ({
			templateId: template.id,
			entryType: line.entryType,
			serviceId: line.serviceId || null,
			sortOrder: index,
		}));

		await db.insert(schema.ledgerEntryTemplateLines).values(templateLines);

		return { success: true as const, result: template };
	} catch (error) {
		console.error("Failed to create ledger entry template:", error);
		return { error: "Failed to create template" };
	}
}

export async function updateLedgerEntryTemplate(data: {
	id: string;
	name: string;
	lines: Array<{ entryType: "charge" | "payment"; serviceId?: string }>;
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

		if (data.lines.length === 0) {
			return { error: "At least one line must be added" };
		}

		const template = await db.query.ledgerEntryTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, data.id),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Validate entry types and services
		const services = await db.query.services.findMany();
		const servicesById = new Map(services.map((s) => [s.id, s]));

		for (const line of data.lines) {
			if (line.entryType !== "charge" && line.entryType !== "payment") {
				return { error: "Invalid entry type" };
			}

			if (line.serviceId) {
				const svc = servicesById.get(line.serviceId);
				if (!svc) {
					return { error: "Service not found" };
				}
				if (svc.type === "group") {
					return { error: "Cannot use group services in templates" };
				}
			}
		}

		// Update template name
		await db
			.update(schema.ledgerEntryTemplates)
			.set({ name })
			.where(eq(schema.ledgerEntryTemplates.id, data.id));

		// Delete existing lines and insert new ones
		await db
			.delete(schema.ledgerEntryTemplateLines)
			.where(eq(schema.ledgerEntryTemplateLines.templateId, data.id));

		const templateLines = data.lines.map((line, index) => ({
			templateId: data.id,
			entryType: line.entryType,
			serviceId: line.serviceId || null,
			sortOrder: index,
		}));

		await db.insert(schema.ledgerEntryTemplateLines).values(templateLines);

		return { success: true as const };
	} catch (error) {
		console.error("Failed to update ledger entry template:", error);
		return { error: "Failed to update template" };
	}
}

export async function deleteLedgerEntryTemplate(templateId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const template = await db.query.ledgerEntryTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, templateId),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Delete template (lines cascade delete via FK)
		await db
			.delete(schema.ledgerEntryTemplates)
			.where(eq(schema.ledgerEntryTemplates.id, templateId));

		return { success: true as const };
	} catch (error) {
		console.error("Failed to delete ledger entry template:", error);
		return { error: "Failed to delete template" };
	}
}
