import { describe, expect, it } from "vitest";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import { buildTenantMessage } from "@/lib/tenant-message";

type Entry = Parameters<typeof buildTenantMessage>[0]["entries"][number];

const uah: MoneyFormat = {
	locale: "uk-UA",
	code: "UAH",
	symbol: "₴",
	minorUnit: 2,
};
const usd: MoneyFormat = {
	locale: "en-US",
	code: "USD",
	symbol: "$",
	minorUnit: 2,
};

const charge = (
	period: string,
	slug: string,
	name: string,
	amount: number,
): Entry => ({
	period,
	entryType: "charge",
	amount,
	quantity: null,
	serviceId: `s-${slug}`,
	service: { name, slug },
});
const payment = (period: string, amount: number): Entry => ({
	period,
	entryType: "payment",
	amount: -amount,
	quantity: null,
	serviceId: null,
	service: null,
});

const m = (minor: number, money = uah) => formatMinorAmount(minor, money);

describe("buildTenantMessage", () => {
	it("lists utilities of the month in Ukrainian with total and debt", () => {
		const entries = [
			charge("2026-07-01", "rent", "Квартплата", 15080),
			payment("2026-07-15", 120000),
			charge("2026-08-01", "rent", "Оренда", 900000),
			charge("2026-08-01", "water", "Водопостачання", 24814),
			charge("2026-08-01", "gas", "Газ", 1591),
			charge("2026-09-01", "gas", "Газ", 9999),
		];
		// balance through August: 15080 - 120000 + 900000 = 795080 (September utilities excluded)
		const text = buildTenantMessage({ entries, month: "2026-08", money: uah });
		expect(text.split("\n")).toEqual([
			"платежі за серпень 2026",
			"",
			`Водопостачання: ${m(24814)}`,
			`Газ: ${m(1591)}`,
			"",
			`В сумі: ${m(26405)}`,
			`Заборгованість за попередні періоди: ${m(795080)}`,
		]);
	});

	it("reports overpayment, excludes rent and sorts services by name", () => {
		const entries = [
			payment("2026-07-01", 101102),
			charge("2026-08-01", "rent", "Rent", 500000),
			charge("2026-08-01", "water", "Water", 2000),
			charge("2026-08-01", "gas", "Gas", 1000),
			payment("2026-08-20", 600000),
		];
		const text = buildTenantMessage({ entries, month: "2026-08", money: usd });
		expect(text.split("\n")).toEqual([
			"Payments for August 2026",
			"",
			`Gas: ${m(1000, usd)}`,
			`Water: ${m(2000, usd)}`,
			"",
			`Total: ${m(3000, usd)}`,
			`Overpayment for previous periods: ${m(201102, usd)}`,
		]);
	});

	it("omits the balance line when settled", () => {
		const entries = [
			charge("2026-08-01", "gas", "Gas", 1000),
			payment("2026-07-01", 0),
		];
		const text = buildTenantMessage({ entries, month: "2026-08", money: usd });
		expect(text).not.toMatch(/previous periods/);
	});

	it("says there are no charges when the month has none", () => {
		const text = buildTenantMessage({
			entries: [],
			month: "2026-08",
			money: uah,
		});
		expect(text).toBe(
			"платежі за серпень 2026\n\nНарахувань за цей період немає.",
		);
	});

	it("falls back to English for other locales", () => {
		const text = buildTenantMessage({
			entries: [],
			month: "2026-02",
			money: { ...usd, locale: "de-DE" },
		});
		expect(text.startsWith("Payments for ")).toBe(true);
	});
});
