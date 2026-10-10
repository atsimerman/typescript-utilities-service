import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import { resolveLocale } from "@/lib/locale";
import {
	balanceAtEndOf,
	chargeCategory,
	ledgerMonthOf,
} from "@/lib/monthly-summary";

type TenantMessageEntry = Parameters<typeof balanceAtEndOf>[0][number];

type Labels = {
	heading: (month: string, year: string) => string;
	noCharges: string;
	total: string;
	overpayment: string;
	debt: string;
};

const LABELS: Record<"uk" | "en", Labels> = {
	uk: {
		heading: (month, year) => `платежі за ${month} ${year}`,
		noCharges: "Нарахувань за цей період немає.",
		total: "В сумі",
		overpayment: "Переплата за попередні періоди",
		debt: "Заборгованість за попередні періоди",
	},
	en: {
		heading: (month, year) => `Payments for ${month} ${year}`,
		noCharges: "No charges for this period.",
		total: "Total",
		overpayment: "Overpayment for previous periods",
		debt: "Debt for previous periods",
	},
};

/**
 * The monthly message sent to the tenant for ledger period `month` (YYYY-MM):
 * one line per utility service, their sum, and the balance carried in from
 * earlier periods (rent is not listed). Language follows the address locale.
 */
export function buildTenantMessage({
	entries,
	month,
	money,
}: {
	entries: TenantMessageEntry[];
	month: string;
	money: MoneyFormat;
}): string {
	const locale = resolveLocale(money.locale);
	const labels = LABELS[locale.startsWith("uk") ? "uk" : "en"];

	const [year, monthNumber] = month.split("-").map(Number);
	const monthName = new Intl.DateTimeFormat(locale, {
		month: "long",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year ?? 1970, (monthNumber ?? 1) - 1, 1)));

	const byService = new Map<string, number>();
	for (const e of entries) {
		if (ledgerMonthOf(e) !== month || chargeCategory(e) !== "utilities") {
			continue;
		}
		const name = e.service?.name ?? "";
		byService.set(name, (byService.get(name) ?? 0) + e.amount);
	}

	const lines = [...byService.entries()].sort(([a], [b]) =>
		a.localeCompare(b, locale),
	);
	const total = lines.reduce((sum, [, amount]) => sum + amount, 0);

	const out = [labels.heading(monthName, String(year)), ""];
	if (lines.length === 0) {
		out.push(labels.noCharges);
	} else {
		for (const [name, amount] of lines) {
			out.push(`${name}: ${formatMinorAmount(amount, money)}`);
		}
		out.push("", `${labels.total}: ${formatMinorAmount(total, money)}`);
	}

	// Utilities of `month` are billed next month, so this is what the tenant
	// carries in from before them (positive balance = debt).
	const balance = balanceAtEndOf(entries, month);
	if (balance !== 0) {
		const label = balance < 0 ? labels.overpayment : labels.debt;
		out.push(`${label}: ${formatMinorAmount(Math.abs(balance), money)}`);
	}

	return out.join("\n");
}
