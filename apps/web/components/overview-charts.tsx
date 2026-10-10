"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
import { formatMonth } from "@/lib/format-date";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import type { ChartPoint, UtilitiesSeries } from "@/lib/overview";

const chargesConfig = {
	rent: { label: "Rent", color: "var(--chart-1)" },
	utilities: { label: "Utilities", color: "var(--chart-2)" },
	other: { label: "Other", color: "var(--chart-3)" },
} satisfies ChartConfig;

const SERVICE_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function OverviewCharts({
	data,
	utilities,
	money,
}: {
	data: ChartPoint[];
	utilities: UtilitiesSeries;
	money: MoneyFormat;
}) {
	const fmt = (minor: number) => formatMinorAmount(minor, money);
	const utilitiesConfig: ChartConfig = Object.fromEntries(
		utilities.services.map((s, i) => [
			s.key,
			{ label: s.name, color: SERVICE_COLORS[i % SERVICE_COLORS.length] },
		]),
	);
	const monthLabel = (m: string) => formatMonth(m, money.locale, "short");

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<div className="rounded-xl border bg-card p-4 shadow-sm">
				<h2 className="mb-3 text-sm font-medium">Monthly charges</h2>
				<ChartContainer config={chargesConfig} className="h-64 w-full">
					<BarChart data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickFormatter={monthLabel}
						/>
						<YAxis
							width={72}
							tickLine={false}
							axisLine={false}
							tickFormatter={fmt}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, items) =>
										monthLabel(String(items[0]?.payload?.month ?? ""))
									}
									formatter={(value, name) => (
										<div className="flex w-full justify-between gap-4">
											<span className="text-muted-foreground">
												{chargesConfig[name as keyof typeof chargesConfig]
													?.label ?? name}
											</span>
											<span className="font-mono tabular-nums">
												{fmt(Number(value))}
											</span>
										</div>
									)}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="rent" stackId="a" fill="var(--color-rent)" />
						<Bar
							dataKey="utilities"
							stackId="a"
							fill="var(--color-utilities)"
						/>
						<Bar dataKey="other" stackId="a" fill="var(--color-other)" />
					</BarChart>
				</ChartContainer>
			</div>

			<div className="rounded-xl border bg-card p-4 shadow-sm">
				<h2 className="mb-3 text-sm font-medium">Utilities by service</h2>
				{utilities.services.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No utility charges in the last {utilities.points.length} months.
					</p>
				) : (
					<ChartContainer config={utilitiesConfig} className="h-64 w-full">
						<LineChart data={utilities.points}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickFormatter={monthLabel}
							/>
							<YAxis
								width={72}
								tickLine={false}
								axisLine={false}
								tickFormatter={fmt}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(_, items) =>
											monthLabel(String(items[0]?.payload?.month ?? ""))
										}
										formatter={(value, name) => (
											<div className="flex w-full justify-between gap-4">
												<span className="text-muted-foreground">
													{utilitiesConfig[String(name)]?.label ?? name}
												</span>
												<span className="font-mono tabular-nums">
													{fmt(Number(value))}
												</span>
											</div>
										)}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							{utilities.services.map((s) => (
								<Line
									key={s.key}
									dataKey={s.key}
									type="monotone"
									stroke={`var(--color-${s.key})`}
									strokeWidth={2}
									dot={{ r: 3 }}
								/>
							))}
						</LineChart>
					</ChartContainer>
				)}
			</div>
		</div>
	);
}
