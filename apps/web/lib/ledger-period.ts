export function normalizePeriodFirstDay(period: string): string | null {
	const t = period.trim();
	if (/^\d{4}-\d{2}$/.test(t)) {
		return `${t}-01`;
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
		const [y, m] = t.split("-").map(Number);
		if (!y || !m || m < 1 || m > 12) return null;
		return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
	}
	return null;
}

export function ledgerEntryPeriodKey(period: Date | string): string {
	if (typeof period === "string") {
		return period.slice(0, 10);
	}
	return period.toISOString().slice(0, 10);
}
