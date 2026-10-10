import { describe, expect, it } from "vitest";
import { formatMinorAmount } from "@/lib/format-money";

// Intl uses non-breaking/narrow spaces; compare with plain spaces.
const plain = (s: string) => s.replace(/[\s  ]/g, " ");

describe("formatMinorAmount", () => {
	it("formats minor units as currency in the given locale", () => {
		const out = plain(
			formatMinorAmount(123456, {
				locale: "en-US",
				code: "USD",
				symbol: "$",
				minorUnit: 2,
			}),
		);
		expect(out).toBe("$1,234.56");
	});

	it("never renders negative zero", () => {
		const out = formatMinorAmount(-0, {
			locale: "en-US",
			code: "USD",
			symbol: "$",
			minorUnit: 2,
		});
		expect(out).not.toContain("-");
	});

	it("keeps the sign for negative amounts", () => {
		const out = formatMinorAmount(-500, {
			locale: "en-US",
			code: "USD",
			symbol: "$",
			minorUnit: 2,
		});
		expect(out).toContain("-");
		expect(plain(out)).toContain("5.00");
	});

	it("respects a zero minor unit", () => {
		const out = plain(
			formatMinorAmount(1500, {
				locale: "en-US",
				code: "JPY",
				symbol: "¥",
				minorUnit: 0,
			}),
		);
		expect(out).toContain("1,500");
		expect(out).not.toContain(".");
	});

	it("falls back to number + symbol for an unknown currency code", () => {
		const out = plain(
			formatMinorAmount(2550, {
				locale: "en-US",
				code: "not-a-code",
				symbol: "pts",
				minorUnit: 2,
			}),
		);
		expect(out).toBe("25.50 pts");
	});

	it("falls back to the default locale for an invalid locale", () => {
		expect(() =>
			formatMinorAmount(100, {
				locale: "###",
				code: "UAH",
				symbol: "₴",
				minorUnit: 2,
			}),
		).not.toThrow();
	});
});
