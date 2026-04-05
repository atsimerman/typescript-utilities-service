"use server";

import { formatMinorAmount } from "@/lib/format-money";
import {
	ledgerEntryPeriodKey,
	normalizePeriodFirstDay,
} from "@/lib/ledger-period";
import { fetchAddressCurrency, fetchLedgerEntries } from "./ledger-entries";

function formatPeriodLabel(period: Date | string): string {
	const key =
		typeof period === "string"
			? period.slice(0, 10)
			: period.toISOString().slice(0, 10);
	const parts = key.split("-");
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
		return key;
	}
	return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en", {
		month: "long",
		year: "numeric",
	});
}

export async function generateLedgerReceipt({
	addressId,
	period,
}: {
	addressId: string;
	period?: string;
}): Promise<{ success: true; receipt: string } | { error: string }> {
	try {
		// Fetch entries and currency
		const [entries, currency] = await Promise.all([
			fetchLedgerEntries(addressId),
			fetchAddressCurrency(addressId),
		]);

		if (!currency) {
			return { error: "Could not fetch currency information" };
		}

		// Filter by period if provided
		let filtered = entries;
		let periodLabel = "All entries";
		if (period) {
			const normalizedPeriod = normalizePeriodFirstDay(period);
			if (!normalizedPeriod) {
				return { error: "Invalid period format" };
			}
			filtered = entries.filter((e) => {
				const entryPeriod = ledgerEntryPeriodKey(e.period);
				return entryPeriod === normalizedPeriod;
			});
			periodLabel = formatPeriodLabel(normalizedPeriod);
		}

		if (filtered.length === 0) {
			const lines: string[] = [];
			lines.push("--- RECEIPT ---");
			lines.push("");
			lines.push(`Period: ${periodLabel}`);
			lines.push("");
			lines.push("No charges or payments for this period.");
			return { success: true, receipt: lines.join("\n") };
		}

		// Group by service (including null for no-service entries)
		const groupedByService = new Map<
			string,
			{ entries: typeof filtered; total: number }
		>();

		for (const entry of filtered) {
			const serviceName = entry.service?.name ?? "Other charge";
			if (!groupedByService.has(serviceName)) {
				groupedByService.set(serviceName, { entries: [], total: 0 });
			}
			const group = groupedByService.get(serviceName)!;
			group.entries.push(entry);
			group.total += entry.amount;
		}

		// Build receipt text
		const lines: string[] = [];
		lines.push("--- RECEIPT ---");
		lines.push("");
		lines.push(`Period: ${periodLabel}`);
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
		lines.push("---");
		lines.push(`TOTAL: ${formatMinorAmount(grandTotal, currency)}`);
		lines.push(`Generated: ${new Date().toLocaleString()}`);

		return { success: true, receipt: lines.join("\n") };
	} catch (error) {
		console.error("Failed to generate receipt:", error);
		return { error: "Failed to generate receipt" };
	}
}
