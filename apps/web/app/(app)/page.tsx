import Link from "next/link";
import { fetchAddresses } from "@/app/actions/addresses";
import {
	fetchAddressCurrency,
	fetchLedgerEntries,
} from "@/app/actions/ledger-entries";
import { OverviewCharts } from "@/components/overview-charts";
import { OverviewStatCard } from "@/components/overview-stat-card";
import { formatMonth } from "@/lib/format-date";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import { currentMonth } from "@/lib/monthly-summary";
import { chartSeries, overviewTotals, utilitiesSeries } from "@/lib/overview";

const CHART_MONTHS = 6;

const BALANCE_LABEL = {
	debt: "Debt",
	overpayment: "Overpayment",
	settled: "Settled",
} as const;

export default async function Page() {
	const addresses = await fetchAddresses();
	const activeAddress = addresses.at(0) ?? null;

	if (!activeAddress) {
		return (
			<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
				<h1 className="text-lg font-semibold">Overview</h1>
				<div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
					Add an address in the sidebar to see the overview.
				</div>
			</div>
		);
	}

	const [currency, entries] = await Promise.all([
		fetchAddressCurrency(activeAddress.id),
		fetchLedgerEntries(activeAddress.id),
	]);
	const money: MoneyFormat = currency ?? { symbol: "", minorUnit: 2 };
	const fmt = (minor: number) => formatMinorAmount(minor, money);

	const month = currentMonth();
	const monthLabel = formatMonth(month, money.locale);
	const totals = overviewTotals(entries, month);
	const series = chartSeries(entries, month, CHART_MONTHS);
	const utilities = utilitiesSeries(entries, month, CHART_MONTHS);

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Overview</h1>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{activeAddress.label || activeAddress.city || "Address"}
					</span>{" "}
					· totals as of {monthLabel}.{" "}
					<Link href="/summary" className="underline underline-offset-4">
						Open monthly summary
					</Link>
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<OverviewStatCard
					title="Current balance"
					value={fmt(Math.abs(totals.balance))}
					hint={BALANCE_LABEL[totals.balanceKind]}
					tone={
						totals.balanceKind === "debt"
							? "debt"
							: totals.balanceKind === "settled"
								? "ok"
								: undefined
					}
				/>
				<OverviewStatCard
					title={`Charged · ${monthLabel}`}
					value={fmt(totals.charged)}
					hint="Rent plus last month's utilities"
				/>
				<OverviewStatCard
					title={`Paid · ${monthLabel}`}
					value={fmt(totals.paid)}
				/>
				<OverviewStatCard
					title="Paid · all time"
					value={fmt(totals.paidAllTime)}
				/>
			</div>

			<OverviewCharts data={series} utilities={utilities} money={money} />
		</div>
	);
}
