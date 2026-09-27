import { resolveLocale } from "@/lib/locale";

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Month + year label for a YYYY-MM / YYYY-MM-DD string or a Date, e.g.
 * "February 2026" (en) or "лютий 2026 р." (uk). Invalid input is returned as is.
 */
export function formatMonth(
	value: string | Date,
	locale: string | null | undefined,
	style: "long" | "short" = "long",
): string {
	const key = typeof value === "string" ? value : value.toISOString();
	const [y, m] = key.slice(0, 7).split("-").map(Number);
	if (!y || !m || m < 1 || m > 12) return key;

	const resolved = resolveLocale(locale);
	const cacheKey = `${resolved}:${style}`;
	let formatter = formatters.get(cacheKey);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(resolved, {
			month: style,
			year: "numeric",
			timeZone: "UTC",
		});
		formatters.set(cacheKey, formatter);
	}
	return formatter.format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Date + time in the given locale (server time zone). */
export function formatDateTime(
	value: Date,
	locale: string | null | undefined,
): string {
	return value.toLocaleString(resolveLocale(locale));
}
