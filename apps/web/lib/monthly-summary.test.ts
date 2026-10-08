import { describe, expect, it } from "vitest";
import {
	balanceAtEndOf,
	billingMonthOf,
	chargeCategory,
	monthlyTrend,
	parseMonth,
	shiftMonth,
	statementTotals,
	utilitiesStatus,
} from "@/lib/monthly-summary";

type Entry = Parameters<typeof statementTotals>[0][number];

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
	quantity: 5,
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

describe("shiftMonth", () => {
	it("moves across year boundaries", () => {
		expect(shiftMonth("2026-01", -1)).toBe("2025-12");
		expect(shiftMonth("2026-12", 1)).toBe("2027-01");
		expect(shiftMonth("2026-05", 0)).toBe("2026-05");
	});
});

describe("parseMonth", () => {
	it("accepts valid YYYY-MM and falls back otherwise", () => {
		expect(parseMonth("2026-04")).toBe("2026-04");
		expect(parseMonth("2026-13")).toMatch(/^\d{4}-\d{2}$/);
		expect(parseMonth(undefined)).toMatch(/^\d{4}-\d{2}$/);
	});
});

describe("chargeCategory / billingMonthOf", () => {
	it("classifies entries", () => {
		expect(chargeCategory(rent("2026-03-01", 100))).toBe("rent");
		expect(chargeCategory(water("2026-03-01", 10))).toBe("utilities");
		expect(chargeCategory(payment("2026-03-01", 10))).toBe("other");
	});

	it("bills utilities one month after consumption, rent in its own month", () => {
		expect(billingMonthOf(rent("2026-03-01", 100))).toBe("2026-03");
		expect(billingMonthOf(water("2026-03-01", 10))).toBe("2026-04");
	});
});

describe("statementTotals", () => {
	it("splits charges by category and counts payments separately", () => {
		const totals = statementTotals([
			rent("2026-04-01", 10000),
			water("2026-03-01", 2500),
			payment("2026-04-05", 4000),
		]);
		expect(totals).toEqual({
			rent: 10000,
			utilities: 2500,
			other: 0,
			totalDue: 12500,
			payments: 4000,
			net: 8500,
		});
	});

	it("returns zeros for no entries", () => {
		expect(statementTotals([]).net).toBe(0);
	});
});

describe("balanceAtEndOf", () => {
	const entries = [
		rent("2026-03-01", 10000),
		water("2026-03-01", 2500), // billed in 2026-04
		payment("2026-03-10", 10000),
	];

	it("excludes utilities not yet billed", () => {
		expect(balanceAtEndOf(entries, "2026-03")).toBe(0);
	});

	it("includes utilities once their billing month is reached", () => {
		expect(balanceAtEndOf(entries, "2026-04")).toBe(2500);
	});
});

describe("utilitiesStatus", () => {
	const entries = [water("2026-02-01", 2000)];

	it("is charged when the consumption month has utilities", () => {
		expect(utilitiesStatus(entries, "2026-03")).toBe("charged");
	});

	it("is pending when only earlier utilities exist", () => {
		expect(utilitiesStatus(entries, "2026-05")).toBe("pending");
	});

	it("is none before any utilities", () => {
		expect(utilitiesStatus(entries, "2026-01")).toBe("none");
		expect(utilitiesStatus([], "2026-03")).toBe("none");
	});
});

describe("monthlyTrend", () => {
	it("returns `count` rows, newest first", () => {
		const rows = monthlyTrend([rent("2026-03-01", 100)], "2026-03", 3);
		expect(rows.map((r) => r.month)).toEqual(["2026-03", "2026-02", "2026-01"]);
		expect(rows[0]?.rent).toBe(100);
		expect(rows[0]?.closingBalance).toBe(100);
		expect(rows[2]?.closingBalance).toBe(0);
	});
});
