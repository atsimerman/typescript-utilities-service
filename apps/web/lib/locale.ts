/** Fallback when an address has no (valid) locale. Matches the DB default. */
export const DEFAULT_LOCALE = "uk-UA";

/** Canonical BCP 47 tag, or null if `value` is not a valid locale. */
export function canonicalLocale(value: string | null | undefined) {
	if (!value?.trim()) return null;
	try {
		return Intl.getCanonicalLocales(value.trim())[0] ?? null;
	} catch {
		return null;
	}
}

/** Canonical locale for `value`, falling back to DEFAULT_LOCALE. */
export function resolveLocale(value: string | null | undefined): string {
	return canonicalLocale(value) ?? DEFAULT_LOCALE;
}
