import { resolveLocale } from "@/lib/locale";

export type MoneyFormat = {
	locale?: string | null; // BCP 47, e.g. uk-UA
	code?: string | null; // ISO 4217, e.g. UAH
	symbol: string;
	minorUnit: number;
};

type CachedFormatter = { formatter: Intl.NumberFormat; isCurrency: boolean };

const formatters = new Map<string, CachedFormatter>();

function createFormatter(
	locale: string,
	code: string | null,
	minorUnit: number,
): CachedFormatter {
	const digits = {
		minimumFractionDigits: minorUnit,
		maximumFractionDigits: minorUnit,
	};
	if (code) {
		try {
			return {
				formatter: new Intl.NumberFormat(locale, {
					style: "currency",
					currency: code,
					currencyDisplay: "narrowSymbol",
					...digits,
				}),
				isCurrency: true,
			};
		} catch {
			// Unknown currency code: fall through to a plain number.
		}
	}
	return {
		formatter: new Intl.NumberFormat(locale, digits),
		isCurrency: false,
	};
}

function getFormatter(
	locale: string | null,
	code: string | null,
	minorUnit: number,
) {
	const resolved = resolveLocale(locale);
	const key = `${resolved}:${code ?? ""}:${minorUnit}`;
	let cached = formatters.get(key);
	if (!cached) {
		cached = createFormatter(resolved, code, minorUnit);
		formatters.set(key, cached);
	}
	return cached;
}

export function formatMinorAmount(minor: number, options: MoneyFormat): string {
	// `|| 0` turns -0 into 0 so it never renders as "-0,00".
	const major = minor / 10 ** options.minorUnit || 0;
	const { formatter, isCurrency } = getFormatter(
		options.locale ?? null,
		options.code ?? null,
		options.minorUnit,
	);
	const formatted = formatter.format(major);
	return isCurrency ? formatted : `${formatted} ${options.symbol}`.trim();
}
