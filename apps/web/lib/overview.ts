import {
	balanceAtEndOf,
	entriesBilledIn,
	monthlyTrend,
	statementTotals,
} from "@/lib/monthly-summary";

type OverviewEntry = Parameters<typeof statementTotals>[0][number];

export type BalanceKind = "debt" | "overpayment" | "settled";

export type OverviewTotals = {
	/** Sum of everything billed up to and including the month (positive = debt). */
	balance: number;
	balanceKind: BalanceKind;
	/** Charges billed in the month. */
	charged: number;
	/** Payments received in the month (positive number). */
	paid: number;
	/** Payments received over the whole ledger (positive number). */
	paidAllTime: number;
};

export function balanceKind(balance: number): BalanceKind {
	if (balance > 0) return "debt";
	if (balance < 0) return "overpayment";
	return "settled";
}

/** Headline numbers for the Overview page, for billing month `month`. */
export function overviewTotals(
	entries: OverviewEntry[],
	month: string,
): OverviewTotals {
	const totals = statementTotals(entriesBilledIn(entries, month));
	const balance = balanceAtEndOf(entries, month);
	const paidAllTime = entries
		.filter((e) => e.entryType === "payment")
		.reduce((acc, e) => acc - e.amount, 0);
	return {
		balance,
		balanceKind: balanceKind(balance),
		charged: totals.totalDue,
		paid: totals.payments,
		paidAllTime,
	};
}

export type ChartPoint = {
	month: string; // YYYY-MM
	rent: number;
	utilities: number;
	other: number;
	closingBalance: number;
};

/** Last `count` billing months ending with `month`, oldest first, for charts. */
export function chartSeries(
	entries: OverviewEntry[],
	month: string,
	count: number,
): ChartPoint[] {
	return monthlyTrend(entries, month, count)
		.map((r) => ({
			month: r.month,
			rent: r.rent,
			utilities: r.utilities,
			other: r.other,
			closingBalance: r.closingBalance,
		}))
		.reverse();
}
