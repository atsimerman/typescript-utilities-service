"use server";

import { formatDateTime, formatMonth } from "@/lib/format-date";
import { formatMinorAmount } from "@/lib/format-money";
import { applyFilters, type LedgerFilters } from "@/lib/ledger-filters";
import { normalizePeriodFirstDay } from "@/lib/ledger-period";
import { fetchAddressCurrency, fetchLedgerEntries } from "./ledger-entries";

export async function generateLedgerReceipt({
	addressId,
	filters,
}: {
	addressId: string;
	filters: LedgerFilters;
}): Promise<
	{ success: true; receipt: string } | { success: false; error: string }
> {
	try {
		// Fetch entries and currency
		const [entries, currency] = await Promise.all([
			fetchLedgerEntries(addressId),
			fetchAddressCurrency(addressId),
		]);

		if (!currency) {
			return { success: false, error: "Could not fetch currency information" };
		}

		const normalizedPeriod = filters.period
			? normalizePeriodFirstDay(filters.period)
			: null;

		if (filters.period && !normalizedPeriod) {
			return { success: false, error: "Invalid period format" };
		}

		const filtered = applyFilters(entries, filters);

		const labelParts: string[] = [];
		if (normalizedPeriod) {
			labelParts.push(formatMonth(normalizedPeriod, currency.locale));
		}
		if (filters.type) {
			labelParts.push(
				`${filters.type.charAt(0).toUpperCase()} ${filters.type.slice(1)} s`,
			);
		}
		const filtersLabel =
			labelParts.length > 0 ? labelParts.join(" | ") : "All entries";

		if (filtered.length === 0) {
			const lines: string[] = [];
			lines.push("--- Ledger Receipt ---");
			lines.push("");
			lines.push(`Filter:    ${filtersLabel}`);
			lines.push(`Generated: ${formatDateTime(new Date(), currency.locale)}`);
			lines.push("");
			lines.push("No entries match the current filters.");
			return { success: true, receipt: lines.join("\n") };
		}

		// Group by service (including null for no-service entries)
		const groupedByService = new Map<
			string,
			{ entries: typeof filtered; total: number }
		>();

		for (const entry of filtered) {
			const serviceName = entry.service?.name ?? "Other charge";
			let group = groupedByService.get(serviceName);
			if (!group) {
				group = { entries: [], total: 0 };
				groupedByService.set(serviceName, group);
			}
			group.entries.push(entry);
			group.total += entry.amount;
		}

		// Build receipt text
		const lines: string[] = [];
		lines.push("--- Ledger Receipt ---");
		lines.push("");
		lines.push(`Filter:    ${filtersLabel}`);
		lines.push(`Generated: ${formatDateTime(new Date(), currency.locale)}`);
		lines.push("");

		// Add line items (sorted by service name for consistency)
		const sortedServices = Array.from(groupedByService.entries()).sort((a, b) =>
			a[0].localeCompare(b[0]),
		);

		for (const [serviceName, group] of sortedServices) {
			const formatted = formatMinorAmount(group.total, currency);
			lines.push(`${serviceName}: ${formatted}`);
		}

		// Calculate grand total
		const grandTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

		lines.push("");
		lines.push(`Total: ${formatMinorAmount(grandTotal, currency)}`);
		lines.push("");

		return { success: true, receipt: lines.join("\n") };
	} catch (error) {
		console.error("Failed to generate receipt:", error);
		return { success: false, error: "Failed to generate receipt" };
	}
}
