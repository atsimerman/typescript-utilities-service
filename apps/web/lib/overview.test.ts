import { describe, expect, it } from "vitest";
import {
	balanceKind,
	chartSeries,
	overviewTotals,
	utilitiesSeries,
} from "@/lib/overview";

type Entry = Parameters<typeof overviewTotals>[0][number];

const rent = (period: string, amount: number): Entry => ({
	period,
	entryType: "charge",
	amount,
	quantity: null,
	serviceId: "s-rent",
	service: { name: "Rent", slug: "rent" },
});
const water = (period: string, amount: number): Entry => ({
	period,
	entryType: "charge",
	amount,
	quantity: 3,
	serviceId: "s-water",
	service: { name: "Water", slug: "water" },
});
const payment = (period: string, amount: number): Entry => ({
	period,
	entryType: "payment",
	amount: -amount,
	quantity: null,
	serviceId: null,
	service: null,
});

describe("balanceKind", () => {
	it("classifies the sign of the balance", () => {
		expect(balanceKind(1)).toBe("debt");
		expect(balanceKind(-1)).toBe("overpayment");
		expect(balanceKind(0)).toBe("settled");
	});
});

describe("overviewTotals", () => {
	const entries = [
		rent("2026-02-01", 10000),
		payment("2026-02-10", 10000),
		rent("2026-03-01", 10000),
		water("2026-02-01", 2000), // consumed in Feb, billed in March
		payment("2026-03-12", 4000),
	];

	it("computes month charges, month payments, balance and all-time paid", () => {
		expect(overviewTotals(entries, "2026-03")).toEqual({
			balance: 8000,
			balanceKind: "debt",
			charged: 12000,
			paid: 4000,
			paidAllTime: 14000,
		});
	});

	it("does not count later months in the balance", () => {
		const t = overviewTotals(entries, "2026-02");
		expect(t.balance).toBe(0);
		expect(t.balanceKind).toBe("settled");
		expect(t.paidAllTime).toBe(14000); // all-time ignores the month
	});

	it("reports an overpayment", () => {
		const t = overviewTotals(
			[rent("2026-03-01", 100), payment("2026-03-02", 150)],
			"2026-03",
		);
		expect(t.balance).toBe(-50);
		expect(t.balanceKind).toBe("overpayment");
	});

	it("handles an empty ledger", () => {
		expect(overviewTotals([], "2026-03")).toEqual({
			balance: 0,
			balanceKind: "settled",
			charged: 0,
			paid: 0,
			paidAllTime: 0,
		});
	});
});

describe("chartSeries", () => {
	it("returns the last N months oldest first with category totals", () => {
		const series = chartSeries(
			[
				rent("2026-02-01", 100),
				rent("2026-03-01", 100),
				payment("2026-03-05", 50),
			],
			"2026-03",
			3,
		);
		expect(series.map((p) => p.month)).toEqual([
			"2026-01",
			"2026-02",
			"2026-03",
		]);
		expect(series.map((p) => p.rent)).toEqual([0, 100, 100]);
	});
});

describe("utilitiesSeries", () => {
	const gas = (period: string, amount: number): Entry => ({
		period,
		entryType: "charge",
		amount,
		quantity: 1,
		serviceId: "s-gas",
		service: { name: "Gas", slug: "gas" },
	});
	// Utilities are billed the month after consumption.
	const entries = [
		rent("2026-01-01", 10000),
		water("2026-01-01", 500), // billed 2026-02
		gas("2026-01-01", 900), // billed 2026-02
		water("2026-02-01", 700), // billed 2026-03
	];

	it("excludes rent and orders services by total, largest first", () => {
		const s = utilitiesSeries(entries, "2026-03", 3, 4);
		expect(s.services.map((x) => x.name)).toEqual(["Water", "Gas"]);
	});

	it("returns oldest-first points with a value per service per month", () => {
		const s = utilitiesSeries(entries, "2026-03", 3, 4);
		const [waterKey, gasKey] = s.services.map((x) => x.key) as [string, string];
		expect(s.points.map((p) => p.month)).toEqual([
			"2026-01",
			"2026-02",
			"2026-03",
		]);
		expect(s.points.map((p) => p[gasKey])).toEqual([0, 900, 0]);
		expect(s.points.map((p) => p[waterKey])).toEqual([0, 500, 700]);
	});

	it("keeps only the `limit` most expensive services", () => {
		const s = utilitiesSeries(entries, "2026-03", 3, 1);
		expect(s.services.map((x) => x.name)).toEqual(["Water"]);
		expect(Object.keys(s.points[0] ?? {})).toEqual([
			"month",
			s.services[0]?.key,
		]);
	});

	it("returns no services for an empty ledger", () => {
		expect(utilitiesSeries([], "2026-03", 3, 4).services).toEqual([]);
	});
});
