import { ledgerEntryPeriodKey } from "@/lib/ledger-period";

type SummaryLedgerEntry = {
	period: Date | string;
	entryType: string;
	amount: number;
	quantity: number | null;
	serviceId: string | null;
	service: { name: string; slug: string } | null;
};

type SummaryMeter = {
	id: string;
	name: string;
	unit: string;
	initialReading: number;
	installedAt: string;
	removedAt: string | null;
	service: { name: string } | null;
};

type SummaryReading = { readingDate: string; value: number };

/**
 * Rent is charged for the month it covers. Utilities are charged the month
 * after consumption. Charges without a service and adjustments are "other".
 */
export type ChargeCategory = "rent" | "utilities" | "other";

/**
 * "charged": utilities for the consumption month are in the ledger.
 * "pending": earlier utilities exist but this month's are not entered yet.
 * "none": no utilities are expected (e.g. before the tenancy started).
 */
export type UtilitiesStatus = "charged" | "pending" | "none";

/** What the tenant owes and pays in one billing month. */
export type StatementTotals = {
	rent: number;
	utilities: number;
	other: number; // charges without a service + adjustments
	totalDue: number;
	payments: number; // positive number: how much was paid
	net: number; // totalDue - payments
};

export type ServiceBreakdownRow = {
	serviceId: string | null;
	name: string;
	category: ChargeCategory;
	quantity: number | null;
	amount: number;
};

export type MeterConsumptionRow = {
	meterId: string;
	name: string;
	serviceName: string | null;
	unit: string;
	opening: number;
	closing: number | null;
	consumption: number | null;
	lastReadingDate: string | null;
};

export type TrendRow = StatementTotals & {
	month: string; // YYYY-MM
	utilitiesStatus: UtilitiesStatus;
	closingBalance: number;
};

/** Current month as YYYY-MM. */
export function currentMonth(): string {
	return new Date().toISOString().slice(0, 7);
}

/** Validates a YYYY-MM string, falling back to the current month. */
export function parseMonth(value: string | undefined): string {
	if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
	return currentMonth();
}

/** Shifts a YYYY-MM month by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
	const [y, m] = month.split("-").map(Number);
	const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + delta, 1));
	return d.toISOString().slice(0, 7);
}

export function formatMonthLabel(month: string): string {
	const [y, m] = month.split("-").map(Number);
	return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1)).toLocaleString("en", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

function monthKey(period: Date | string): string {
	return ledgerEntryPeriodKey(period).slice(0, 7);
}

export const RENT_SERVICE_SLUG = "rent";

export function chargeCategory(entry: SummaryLedgerEntry): ChargeCategory {
	if (entry.entryType !== "charge") return "other";
	if (entry.service?.slug === RENT_SERVICE_SLUG) return "rent";
	if (entry.serviceId) return "utilities";
	return "other";
}

/**
 * Month (YYYY-MM) in which the entry is billed. Ledger `period` is the month
 * the service covers, so utilities shift one month forward; rent, payments and
 * adjustments are billed in their recorded period.
 */
export function billingMonthOf(entry: SummaryLedgerEntry): string {
	const month = monthKey(entry.period);
	return chargeCategory(entry) === "utilities" ? shiftMonth(month, 1) : month;
}

/** Consumption month whose utilities are billed in `month`. */
export function utilitiesMonthFor(month: string): string {
	return shiftMonth(month, -1);
}

export function entriesBilledIn<T extends SummaryLedgerEntry>(
	entries: T[],
	month: string,
): T[] {
	return entries.filter((e) => billingMonthOf(e) === month);
}

export function statementTotals(
	entries: SummaryLedgerEntry[],
): StatementTotals {
	const totals: StatementTotals = {
		rent: 0,
		utilities: 0,
		other: 0,
		totalDue: 0,
		payments: 0,
		net: 0,
	};
	for (const e of entries) {
		if (e.entryType === "payment") {
			totals.payments -= e.amount;
		} else {
			totals[chargeCategory(e)] += e.amount;
			totals.totalDue += e.amount;
		}
		totals.net += e.amount;
	}
	return totals;
}

export function utilitiesStatus(
	entries: SummaryLedgerEntry[],
	month: string,
): UtilitiesStatus {
	const consumptionMonth = utilitiesMonthFor(month);
	let hasEarlier = false;
	for (const e of entries) {
		if (chargeCategory(e) !== "utilities") continue;
		const m = monthKey(e.period);
		if (m === consumptionMonth) return "charged";
		if (m < consumptionMonth) hasEarlier = true;
	}
	return hasEarlier ? "pending" : "none";
}

/** Sum of everything billed up to and including `month` (positive = debt). */
export function balanceAtEndOf(
	entries: SummaryLedgerEntry[],
	month: string,
): number {
	return entries
		.filter((e) => billingMonthOf(e) <= month)
		.reduce((acc, e) => acc + e.amount, 0);
}

/** Non-payment entries grouped by service, largest amount first. */
export function serviceBreakdown(
	entries: SummaryLedgerEntry[],
): ServiceBreakdownRow[] {
	const rows = new Map<string, ServiceBreakdownRow>();
	for (const e of entries) {
		if (e.entryType === "payment") continue;
		const key = `${e.entryType}:${e.serviceId ?? "none"}`;
		let row = rows.get(key);
		if (!row) {
			row = {
				serviceId: e.serviceId,
				name:
					e.entryType === "adjustment"
						? `Adjustment${e.service ? ` · ${e.service.name}` : ""}`
						: (e.service?.name ?? "No service"),
				category: chargeCategory(e),
				quantity: null,
				amount: 0,
			};
			rows.set(key, row);
		}
		row.amount += e.amount;
		if (e.quantity != null) row.quantity = (row.quantity ?? 0) + e.quantity;
	}
	return [...rows.values()].sort((a, b) => b.amount - a.amount);
}

/**
 * Consumption per meter within the month: last reading in the month minus the
 * last reading before it (or the initial reading). Meters not installed during
 * the month are skipped.
 */
export function meterConsumption(
	meters: Array<SummaryMeter & { readings: SummaryReading[] }>,
	month: string,
): MeterConsumptionRow[] {
	const monthStart = `${month}-01`;
	// Dates are YYYY-MM-DD strings, so "-31" is an upper bound for any month.
	const monthEnd = `${month}-31`;

	return meters
		.filter(
			(m) =>
				m.installedAt <= monthEnd &&
				(m.removedAt == null || m.removedAt >= monthStart),
		)
		.map((m) => {
			const before = m.readings.filter((r) => r.readingDate < monthStart);
			const within = m.readings.filter(
				(r) => r.readingDate >= monthStart && r.readingDate <= monthEnd,
			);
			const opening = before.at(-1)?.value ?? m.initialReading;
			const last = within.at(-1) ?? null;

			return {
				meterId: m.id,
				name: m.name,
				serviceName: m.service?.name ?? null,
				unit: m.unit,
				opening,
				closing: last?.value ?? null,
				consumption: last ? last.value - opening : null,
				lastReadingDate: last?.readingDate ?? null,
			};
		});
}

/** Statements for the `count` billing months ending with `month`, newest first. */
export function monthlyTrend(
	entries: SummaryLedgerEntry[],
	month: string,
	count: number,
): TrendRow[] {
	const rows: TrendRow[] = [];
	for (let i = 0; i < count; i++) {
		const m = shiftMonth(month, -i);
		rows.push({
			month: m,
			...statementTotals(entriesBilledIn(entries, m)),
			utilitiesStatus: utilitiesStatus(entries, m),
			closingBalance: balanceAtEndOf(entries, m),
		});
	}
	return rows;
}
