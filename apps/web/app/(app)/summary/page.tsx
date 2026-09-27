import { buttonVariants } from "@repo/ui/components/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { fetchAddresses } from "@/app/actions/addresses";
import {
	fetchAddressCurrency,
	fetchLedgerEntries,
} from "@/app/actions/ledger-entries";
import { fetchMeterReadings } from "@/app/actions/meter-readings";
import { fetchMeters } from "@/app/actions/meters";
import { formatMonth } from "@/lib/format-date";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import {
	balanceAtEndOf,
	type ChargeCategory,
	currentMonth,
	entriesBilledIn,
	meterConsumption,
	monthlyTrend,
	parseMonth,
	type ServiceBreakdownRow,
	serviceBreakdown,
	shiftMonth,
	statementTotals,
	utilitiesMonthFor,
	utilitiesStatus,
} from "@/lib/monthly-summary";

const TREND_MONTHS = 6;

const thClass =
	"px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground";
const numThClass = `${thClass} text-right`;
const numTdClass = "px-3 py-2 text-right font-mono text-[11px] tabular-nums";

function balanceLabel(balance: number) {
	if (balance > 0) return "Debt";
	if (balance < 0) return "Overpayment";
	return "Settled";
}

function percentChange(current: number, previous: number): string | null {
	if (previous === 0) return null;
	const change = ((current - previous) / Math.abs(previous)) * 100;
	const sign = change > 0 ? "+" : "";
	return `${sign}${change.toFixed(0)}%`;
}

function StatCard({
	title,
	value,
	hint,
}: {
	title: string;
	value: string;
	hint?: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{title}
			</h2>
			<p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
			{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}

export default async function SummaryPage({
	searchParams,
}: {
	searchParams: Promise<{ month?: string }>;
}) {
	const params = await searchParams;
	const month = parseMonth(params.month);
	const prevMonth = shiftMonth(month, -1);
	const nextMonth = shiftMonth(month, 1);
	const isCurrentMonth = month >= currentMonth();

	const addresses = await fetchAddresses();
	const activeAddress = addresses.at(0) ?? null;

	if (!activeAddress) {
		return (
			<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
				<h1 className="text-lg font-semibold">Monthly summary</h1>
				<div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
					Add an address in the sidebar to see the monthly summary.
				</div>
			</div>
		);
	}

	const [currency, entries, meters] = await Promise.all([
		fetchAddressCurrency(activeAddress.id),
		fetchLedgerEntries(activeAddress.id),
		fetchMeters(activeAddress.id),
	]);
	const money: MoneyFormat = currency ?? { symbol: "", minorUnit: 2 };
	const fmt = (minor: number) => formatMinorAmount(minor, money);
	const formatMonthLabel = (m: string) => formatMonth(m, money.locale);

	const metersWithReadings = await Promise.all(
		meters.map(async (m) => ({
			...m,
			readings: await fetchMeterReadings(m.id),
		})),
	);

	const utilitiesMonth = utilitiesMonthFor(month);
	const monthEntries = entriesBilledIn(entries, month);
	const totals = statementTotals(monthEntries);
	const utilities = utilitiesStatus(entries, month);
	const prevTotals = statementTotals(entriesBilledIn(entries, prevMonth));
	const prevUtilities = utilitiesStatus(entries, prevMonth);
	const closingBalance = balanceAtEndOf(entries, month);
	const openingBalance = balanceAtEndOf(entries, prevMonth);
	const services = serviceBreakdown(monthEntries);
	const consumption = meterConsumption(metersWithReadings, utilitiesMonth);
	const trend = monthlyTrend(entries, month, TREND_MONTHS);
	const dueChange =
		utilities !== "pending" && prevUtilities !== "pending"
			? percentChange(totals.totalDue, prevTotals.totalDue)
			: null;
	const paymentCount = monthEntries.filter(
		(e) => e.entryType === "payment",
	).length;

	const groups: Array<{
		category: ChargeCategory;
		title: string;
		ledgerMonth: string;
		rows: ServiceBreakdownRow[];
		subtotal: number;
	}> = [
		{
			category: "rent",
			title: `Rent · ${formatMonthLabel(month)}`,
			ledgerMonth: month,
			rows: services.filter((r) => r.category === "rent"),
			subtotal: totals.rent,
		},
		{
			category: "utilities",
			title: `Utilities · used in ${formatMonthLabel(utilitiesMonth)}`,
			ledgerMonth: utilitiesMonth,
			rows: services.filter((r) => r.category === "utilities"),
			subtotal: totals.utilities,
		},
		{
			category: "other",
			title: "Other & adjustments",
			ledgerMonth: month,
			rows: services.filter((r) => r.category === "other"),
			subtotal: totals.other,
		},
	];

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-lg font-semibold">Monthly summary</h1>
					<p className="text-sm text-muted-foreground">
						What the tenant pays in {formatMonthLabel(month)} for{" "}
						<span className="font-medium text-foreground">
							{activeAddress.label || activeAddress.city || "Address"}
						</span>
						: rent for {formatMonthLabel(month)} and utilities used in{" "}
						{formatMonthLabel(utilitiesMonth)}.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						href={`/summary?month=${prevMonth}`}
						aria-label="Previous month"
						className={buttonVariants({ variant: "outline", size: "icon-sm" })}
					>
						<ChevronLeftIcon />
					</Link>
					<span className="min-w-32 text-center text-sm font-medium">
						{formatMonthLabel(month)}
					</span>
					{isCurrentMonth ? (
						<span
							aria-disabled
							className={buttonVariants({
								variant: "outline",
								size: "icon-sm",
								className: "pointer-events-none opacity-50",
							})}
						>
							<ChevronRightIcon />
						</span>
					) : (
						<Link
							href={`/summary?month=${nextMonth}`}
							aria-label="Next month"
							className={buttonVariants({
								variant: "outline",
								size: "icon-sm",
							})}
						>
							<ChevronRightIcon />
						</Link>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<StatCard
					title="Rent"
					value={fmt(totals.rent)}
					hint={`For ${formatMonthLabel(month)}`}
				/>
				<StatCard
					title="Utilities"
					value={
						utilities === "pending" ? "Not calculated" : fmt(totals.utilities)
					}
					hint={
						utilities === "pending"
							? `${formatMonthLabel(utilitiesMonth)} usage not entered yet`
							: `Used in ${formatMonthLabel(utilitiesMonth)}`
					}
				/>
				<StatCard
					title={utilities === "pending" ? "Total due · partial" : "Total due"}
					value={fmt(totals.totalDue)}
					hint={
						<>
							{utilities === "pending"
								? "Rent only, utilities still to come"
								: dueChange
									? `${dueChange} vs ${formatMonthLabel(prevMonth)}`
									: "Rent + utilities"}
							{totals.other !== 0 && ` · Other ${fmt(totals.other)}`}
						</>
					}
				/>
				<StatCard
					title="Paid"
					value={fmt(totals.payments)}
					hint={`${paymentCount} payment(s) recorded for ${formatMonthLabel(month)}`}
				/>
				<StatCard
					title={`Balance · ${balanceLabel(closingBalance)}`}
					value={fmt(Math.abs(closingBalance))}
					hint={`Opening ${fmt(openingBalance)} → closing ${fmt(closingBalance)}`}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-medium">
						Statement for {formatMonthLabel(month)}
					</h2>
					<div className="overflow-x-auto rounded-lg border bg-background text-xs">
						<table className="w-full border-collapse text-left">
							<thead>
								<tr className="border-b border-border bg-muted/40">
									<th className={thClass}>Service</th>
									<th className={numThClass}>Qty</th>
									<th className={numThClass}>Amount</th>
								</tr>
							</thead>
							{groups
								.filter((g) => g.category !== "other" || g.rows.length > 0)
								.map((group) => (
									<tbody key={group.category}>
										<tr className="border-b border-border bg-muted/20">
											<td
												colSpan={3}
												className="px-3 py-2 text-[11px] font-medium"
											>
												<div className="flex items-baseline justify-between gap-2">
													<span>{group.title}</span>
													<Link
														href={`/ledger?period=${group.ledgerMonth}`}
														className="font-normal text-muted-foreground underline-offset-4 hover:underline"
													>
														View in ledger
													</Link>
												</div>
											</td>
										</tr>
										{group.rows.length === 0 ? (
											<tr className="border-b border-border">
												<td
													colSpan={3}
													className="px-3 py-2 text-[11px] text-muted-foreground"
												>
													{group.category === "utilities" &&
													utilities === "pending"
														? "Not calculated yet"
														: "No charges"}
												</td>
											</tr>
										) : (
											group.rows.map((row) => (
												<tr
													key={`${row.name}:${row.serviceId ?? "none"}`}
													className="border-b border-border"
												>
													<td className="px-3 py-2 pl-6 text-[11px]">
														{row.name}
													</td>
													<td className={numTdClass}>{row.quantity ?? "—"}</td>
													<td className={numTdClass}>{fmt(row.amount)}</td>
												</tr>
											))
										)}
										{group.rows.length > 1 && (
											<tr className="border-b border-border">
												<td className="px-3 py-2 pl-6 text-[11px] text-muted-foreground">
													Subtotal
												</td>
												<td className={numTdClass} />
												<td className={`${numTdClass} font-medium`}>
													{fmt(group.subtotal)}
												</td>
											</tr>
										)}
									</tbody>
								))}
							<tfoot>
								<tr className="border-b border-border bg-muted/40 font-medium">
									<td className="px-3 py-2 text-[11px]">
										Total due{utilities === "pending" && " (partial)"}
									</td>
									<td className={numTdClass} />
									<td className={numTdClass}>{fmt(totals.totalDue)}</td>
								</tr>
								<tr className="border-b border-border">
									<td className="px-3 py-2 text-[11px]">Paid</td>
									<td className={numTdClass} />
									<td className={numTdClass}>{fmt(-totals.payments)}</td>
								</tr>
								<tr className="bg-muted/40 font-medium">
									<td className="px-3 py-2 text-[11px]">Net for month</td>
									<td className={numTdClass} />
									<td className={numTdClass}>{fmt(totals.net)}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>

				<section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex items-baseline justify-between gap-2">
						<h2 className="text-sm font-medium">
							Meter consumption · {formatMonthLabel(utilitiesMonth)}
						</h2>
						<Link
							href="/meters"
							className="text-xs text-muted-foreground underline-offset-4 hover:underline"
						>
							View meters
						</Link>
					</div>
					<p className="text-xs text-muted-foreground">
						Usage behind the utilities billed in {formatMonthLabel(month)}.
					</p>
					<div className="overflow-x-auto rounded-lg border bg-background text-xs">
						{consumption.length === 0 ? (
							<p className="p-4 text-muted-foreground">
								No meters active in {formatMonthLabel(utilitiesMonth)}.
							</p>
						) : (
							<table className="w-full border-collapse text-left">
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className={thClass}>Meter</th>
										<th className={numThClass}>Opening</th>
										<th className={numThClass}>Closing</th>
										<th className={numThClass}>Used</th>
									</tr>
								</thead>
								<tbody>
									{consumption.map((row) => (
										<tr
											key={row.meterId}
											className="border-b border-border last:border-b-0"
										>
											<td className="px-3 py-2 text-[11px]">
												<div>{row.name}</div>
												{row.serviceName && (
													<div className="text-[10px] text-muted-foreground">
														{row.serviceName}
													</div>
												)}
											</td>
											<td className={numTdClass}>{row.opening}</td>
											<td className={numTdClass}>
												{row.closing ?? "—"}
												{row.lastReadingDate && (
													<div className="text-[10px] text-muted-foreground">
														{row.lastReadingDate}
													</div>
												)}
											</td>
											<td className={`${numTdClass} font-medium`}>
												{row.consumption != null ? (
													`${row.consumption} ${row.unit}`
												) : (
													<span className="font-sans font-normal text-muted-foreground">
														No reading
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</section>
			</div>

			<section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
				<h2 className="text-sm font-medium">Last {TREND_MONTHS} months</h2>
				<div className="overflow-x-auto rounded-lg border bg-background text-xs">
					<table className="w-full border-collapse text-left">
						<thead>
							<tr className="border-b border-border bg-muted/40">
								<th className={thClass}>Billed in</th>
								<th className={numThClass}>Rent</th>
								<th className={numThClass}>Utilities (prev. month)</th>
								<th className={numThClass}>Other</th>
								<th className={numThClass}>Total due</th>
								<th className={numThClass}>Paid</th>
								<th className={numThClass}>Closing balance</th>
							</tr>
						</thead>
						<tbody>
							{trend.map((row) => (
								<tr
									key={row.month}
									className={`border-b border-border last:border-b-0 ${row.month === month ? "bg-muted/40 font-medium" : ""}`}
								>
									<td className="px-3 py-2 text-[11px]">
										<Link
											href={`/summary?month=${row.month}`}
											className="underline-offset-4 hover:underline"
										>
											{formatMonthLabel(row.month)}
										</Link>
									</td>
									<td className={numTdClass}>{fmt(row.rent)}</td>
									<td className={numTdClass}>
										{row.utilitiesStatus === "pending" ? (
											<span className="font-sans text-muted-foreground">
												Pending
											</span>
										) : (
											fmt(row.utilities)
										)}
									</td>
									<td className={numTdClass}>{fmt(row.other)}</td>
									<td className={numTdClass}>{fmt(row.totalDue)}</td>
									<td className={numTdClass}>{fmt(row.payments)}</td>
									<td className={numTdClass}>{fmt(row.closingBalance)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
