export default function SummaryPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-2">
				<h1 className="text-lg font-semibold">Monthly summary</h1>
				<p className="text-sm text-muted-foreground">
					High-level monthly breakdown of charges, payments, and resulting
					balance for the selected property.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-medium">Total charges</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						TODO: sum of charge entries for the selected month.
					</p>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-medium">Total payments</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						TODO: sum of payment entries for the selected month.
					</p>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-medium">Net balance</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						TODO: charges minus payments, showing debt or overpayment.
					</p>
				</div>
			</div>

			<div className="rounded-xl border bg-card p-4 shadow-sm">
				<h2 className="text-sm font-medium">Per-service breakdown</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					TODO: aggregated view of charges and payments per service (rent,
					electricity, water, etc.) for the selected period.
				</p>
			</div>
		</div>
	);
}
