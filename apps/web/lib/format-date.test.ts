import { describe, expect, it } from "vitest";
import { formatMonth } from "@/lib/format-date";

describe("formatMonth", () => {
	it("formats a YYYY-MM string as month and year", () => {
		expect(formatMonth("2026-02", "en-US")).toBe("February 2026");
	});

	it("accepts a full date and uses UTC, not the server time zone", () => {
		expect(formatMonth("2026-03-31", "en-US")).toBe("March 2026");
		expect(formatMonth(new Date("2026-01-01T00:00:00Z"), "en-US")).toBe(
			"January 2026",
		);
	});

	it("supports the short style", () => {
		expect(formatMonth("2026-02", "en-US", "short")).toBe("Feb 2026");
	});

	it("returns invalid input unchanged", () => {
		expect(formatMonth("2026-13", "en-US")).toBe("2026-13");
		expect(formatMonth("garbage", "en-US")).toBe("garbage");
	});
});
