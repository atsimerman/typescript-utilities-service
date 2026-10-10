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
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
} from "recharts";
import { formatMonth } from "@/lib/format-date";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import type { ChartPoint } from "@/lib/overview";

const chargesConfig = {
	rent: { label: "Rent", color: "var(--chart-1)" },
	utilities: { label: "Utilities", color: "var(--chart-2)" },
	other: { label: "Other", color: "var(--chart-3)" },
} satisfies ChartConfig;

const balanceConfig = {
	closingBalance: { label: "Balance", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function OverviewCharts({
	data,
	money,
}: {
	data: ChartPoint[];
	money: MoneyFormat;
}) {
	const fmt = (minor: number) => formatMinorAmount(minor, money);
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
				<h2 className="mb-3 text-sm font-medium">Balance at month end</h2>
				<ChartContainer config={balanceConfig} className="h-64 w-full">
					<AreaChart data={data}>
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
									formatter={(value) => (
										<span className="font-mono tabular-nums">
											{fmt(Number(value))}
										</span>
									)}
								/>
							}
						/>
						<Area
							dataKey="closingBalance"
							type="monotone"
							stroke="var(--color-closingBalance)"
							fill="var(--color-closingBalance)"
							fillOpacity={0.2}
						/>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
