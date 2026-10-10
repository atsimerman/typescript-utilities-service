import {
	balanceAtEndOf,
	entriesBilledIn,
	monthlyTrend,
	serviceBreakdown,
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
		}))
		.reverse();
}

export type UtilitiesSeries = {
	/** Utility services, largest total first. `key` is safe for CSS variables. */
	services: Array<{ key: string; name: string }>;
	/** Oldest first; one numeric field per service key. */
	points: Array<{ month: string } & Record<string, number | string>>;
};

/**
 * Utilities cost per service for the last `count` billing months, limited to
 * the `limit` most expensive services over that period.
 */
export function utilitiesSeries(
	entries: OverviewEntry[],
	month: string,
	count: number,
	limit: number,
): UtilitiesSeries {
	const months = monthlyTrend(entries, month, count)
		.map((r) => r.month)
		.reverse();
	const perMonth = months.map((m) =>
		serviceBreakdown(entriesBilledIn(entries, m)).filter(
			(row) => row.category === "utilities",
		),
	);

	const totals = new Map<string, { name: string; total: number }>();
	for (const rows of perMonth) {
		for (const row of rows) {
			const id = row.serviceId ?? row.name;
			const cur = totals.get(id) ?? { name: row.name, total: 0 };
			cur.total += row.amount;
			totals.set(id, cur);
		}
	}
	const ordered = [...totals.entries()]
		.sort((a, b) => b[1].total - a[1].total)
		.slice(0, limit);
	const keyById = new Map(ordered.map(([id], i) => [id, `service${i}`]));

	return {
		services: ordered.map(([, v], i) => ({ key: `service${i}`, name: v.name })),
		points: months.map((m, i) => {
			const point: { month: string } & Record<string, number | string> = {
				month: m,
			};
			for (const key of keyById.values()) point[key] = 0;
			for (const row of perMonth[i] ?? []) {
				const key = keyById.get(row.serviceId ?? row.name);
				if (key) point[key] = row.amount;
			}
			return point;
		}),
	};
}
