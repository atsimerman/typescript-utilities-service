"use server";

import { createDB, schema } from "@repo/database";
import { normalizePeriodFirstDay } from "@/lib/ledger-period";

export type LedgerEntryType = "charge" | "payment" | "adjustment";

export async function fetchLedgerEntries(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is not set");
			return [];
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const entries = await db.query.ledgerEntries.findMany({
			where: (e, { eq }) => eq(e.addressId, addressId),
			orderBy: (e, { asc }) => [asc(e.period), asc(e.createdAt), asc(e.id)],
		});

		const services = await db.query.services.findMany();
		const servicesById = new Map(services.map((s) => [s.id, s]));

		return (entries || []).map((row) => ({
			...row,
			service: row.serviceId
				? (servicesById.get(row.serviceId) ?? null)
				: null,
		}));
	} catch (error) {
		console.error("Failed to fetch ledger entries:", error);
		return [];
	}
}

export async function fetchAddressCurrency(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return null;
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const address = await db.query.addresses.findFirst({
			where: (a, { eq }) => eq(a.id, addressId),
		});
		if (!address) return null;

		const currency = await db.query.currencies.findFirst({
			where: (c, { eq }) => eq(c.id, address.currencyId),
		});
		if (!currency) {
			return {
				symbol: "",
				minorUnit: 2,
			};
		}

		return {
			symbol: currency.symbol,
			minorUnit: currency.minorUnit,
		};
	} catch (error) {
		console.error("Failed to fetch address currency:", error);
		return null;
	}
}

export async function createLedgerEntry(data: {
	addressId: string;
	period: string;
	entryType: LedgerEntryType;
	amountMajor: number;
	serviceId?: string | null;
	note?: string | null;
	quantity?: number | null;
	unitPriceMinor?: number | null;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const periodDay = normalizePeriodFirstDay(data.period);
		if (!periodDay) {
			return { error: "Invalid period (use YYYY-MM)" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		let amountMinor: number;
		const major = data.amountMajor;

		if (data.entryType === "payment") {
			if (major <= 0) {
				return { error: "Payment amount must be greater than zero" };
			}
			amountMinor = -Math.round(major * 100);
		} else if (data.entryType === "charge") {
			if (major <= 0) {
				return { error: "Charge amount must be greater than zero" };
			}
			amountMinor = Math.round(major * 100);
		} else {
			if (major === 0) {
				return { error: "Adjustment amount cannot be zero" };
			}
			amountMinor = Math.round(major * 100);
		}

		const note = data.note?.trim() || null;
		if (data.entryType === "adjustment" && !note) {
			return { error: "Note is required for adjustments" };
		}

		if (data.serviceId) {
			const svc = await db.query.services.findFirst({
				where: (s, { eq }) => eq(s.id, data.serviceId as string),
			});
			if (svc?.type === "group") {
				return { error: "Cannot link ledger entry to a group service" };
			}
		}

		await db.insert(schema.ledgerEntries).values({
			addressId: data.addressId,
			serviceId: data.serviceId || null,
			meterId: null,
			period: periodDay,
			entryType: data.entryType,
			quantity: data.quantity ?? null,
			unitPrice: data.unitPriceMinor ?? null,
			amount: amountMinor,
			note,
		});

		return { success: true as const };
	} catch (error) {
		console.error("Failed to create ledger entry:", error);
		return { error: "Failed to create ledger entry" };
	}
}

export async function sumLedgerAmountsForAddress(addressId: string) {
	try {
		if (!process.env.DATABASE_URL) {
			return 0;
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		const rows = await db.query.ledgerEntries.findMany({
			where: (e, { eq }) => eq(e.addressId, addressId),
			columns: { amount: true },
		});

		return rows.reduce((acc, r) => acc + r.amount, 0);
	} catch (error) {
		console.error("Failed to sum ledger amounts:", error);
		return 0;
	}
}

export async function createLedgerEntriesFromTemplate(data: {
	templateId: string;
	period: string;
	rows: Array<{ lineId: string; amountMajor: number; note?: string }>;
}) {
	try {
		if (!process.env.DATABASE_URL) {
			return { error: "Database URL is not set" };
		}

		const periodDay = normalizePeriodFirstDay(data.period);
		if (!periodDay) {
			return { error: "Invalid period (use YYYY-MM)" };
		}

		const db = createDB({
			pgUrl: process.env.DATABASE_URL,
		});

		// Fetch template and verify it exists
		const template = await db.query.ledgerEntryTemplates.findFirst({
			where: (t, { eq }) => eq(t.id, data.templateId),
		});

		if (!template) {
			return { error: "Template not found" };
		}

		// Fetch template lines
		const templateLines = await db.query.ledgerEntryTemplateLines.findMany({
			where: (l, { eq }) => eq(l.templateId, data.templateId),
		});

		const lineById = new Map(templateLines.map((l) => [l.id, l]));

		// Validate services
		const services = await db.query.services.findMany();
		const servicesById = new Map(services.map((s) => [s.id, s]));

		// Validate submissions and build ledger entries
		const errors: string[] = [];
		const entries = [];

		for (const row of data.rows) {
			const line = lineById.get(row.lineId);
			if (!line) {
				errors.push(`Line not found in template`);
				continue;
			}

			const amountMajor = row.amountMajor;
			if (Number.isNaN(amountMajor)) {
				errors.push(`${line.entryType}: Amount must be a number`);
				continue;
			}

			// Validate service if present
			if (line.serviceId) {
				const svc = servicesById.get(line.serviceId);
				if (!svc || svc.type === "group") {
					errors.push(`${line.entryType}: Invalid service`);
					continue;
				}
			}

			// Convert amount to minor units based on entry type
			let amountMinor: number;

			if (line.entryType === "payment") {
				if (amountMajor <= 0) {
					errors.push(`Payment: Amount must be greater than zero`);
					continue;
				}
				amountMinor = -Math.round(amountMajor * 100);
			} else if (line.entryType === "charge") {
				if (amountMajor <= 0) {
					errors.push(`Charge: Amount must be greater than zero`);
					continue;
				}
				amountMinor = Math.round(amountMajor * 100);
			} else {
				errors.push(`Invalid entry type`);
				continue;
			}

			const note = row.note?.trim() || null;

			entries.push({
				addressId: template.addressId,
				serviceId: line.serviceId || null,
				meterId: null,
				period: periodDay,
				entryType: line.entryType,
				quantity: null,
				unitPrice: null,
				amount: amountMinor,
				note,
			});
		}

		if (errors.length > 0) {
			return {
				error: "Validation failed",
				details: errors,
			};
		}

		if (entries.length === 0) {
			return { error: "No entries to create" };
		}

		// Insert all entries
		await db.insert(schema.ledgerEntries).values(entries);

		return { success: true as const };
	} catch (error) {
		console.error("Failed to create ledger entries from template:", error);
		return { error: "Failed to create entries" };
	}
}
