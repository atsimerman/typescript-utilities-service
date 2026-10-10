import { describe, expect, it } from "vitest";
import { balanceKind, overviewTotals } from "@/lib/overview";

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
