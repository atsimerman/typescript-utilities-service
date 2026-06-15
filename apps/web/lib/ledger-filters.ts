import {
	ledgerEntryPeriodKey,
	normalizePeriodFirstDay,
} from "@/lib/ledger-period";
import type { LedgerEntryType } from "@/types/ledger-entry";

export type LedgerFilters = {
	period: string | null; // YYYY-MM
	type: LedgerEntryType | null;
};

export const LEDGER_TYPE_OPTIONS = [
	{ value: "charge" as LedgerEntryType, label: "Charge" },
	{ value: "payment" as LedgerEntryType, label: "Payment" },
	{ value: "adjustment" as LedgerEntryType, label: "Adjustment" },
] as const;

const VALID_TYPES = new Set<string>(LEDGER_TYPE_OPTIONS.map((o) => o.value));

export function parseLedgerFilters(params: {
	period?: string;
	type?: string;
}): LedgerFilters {
	const period =
		params.period != null && params.period !== ""
			? params.period.slice(0, 7)
			: null;

	const type =
		params.type != null && VALID_TYPES.has(params.type)
			? (params.type as LedgerEntryType)
			: null;

	return { period, type };
}

export function isFiltered(filters: LedgerFilters): boolean {
	return filters.period != null || filters.type != null;
}

export function applyFilters<
	T extends { period: Date | string; entryType: string },
>(entries: T[], filters: LedgerFilters): T[] {
	const normalizedPeriod = filters.period
		? normalizePeriodFirstDay(filters.period)
		: null;

	return entries
		.filter(
			(e) =>
				normalizedPeriod == null ||
				ledgerEntryPeriodKey(e.period) === normalizedPeriod,
		)
		.filter((e) => filters.type == null || e.entryType === filters.type);
}
