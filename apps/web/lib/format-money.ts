export function formatMinorAmount(
	minor: number,
	options: { symbol: string; minorUnit: number },
): string {
	const divisor = 10 ** options.minorUnit;
	const major = minor / divisor;
	const abs = Math.abs(major);
	const formatted = abs.toFixed(options.minorUnit);
	const sign = major < 0 ? "-" : "";
	return `${sign}${formatted} ${options.symbol}`.trim();
}
