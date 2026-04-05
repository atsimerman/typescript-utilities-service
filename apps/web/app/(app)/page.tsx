export default function Page() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="mb-1 text-sm font-medium text-muted-foreground">
						Contractual pricing
					</h2>
					<p className="mb-3 text-xs text-muted-foreground">
						Each service has versioned pricing with effective date ranges.
					</p>
					<ul className="space-y-1 text-xs">
						<li>• Fixed monthly rent</li>
						<li>• Per-unit utility tariffs</li>
						<li>• Price history and future changes</li>
					</ul>
				</div>

				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="mb-1 text-sm font-medium text-muted-foreground">
						Metered consumption
					</h2>
					<p className="mb-3 text-xs text-muted-foreground">
						Immutable meter readings and lifecycle-aware meter replacements.
					</p>
					<ul className="space-y-1 text-xs">
						<li>• Physical meters per service</li>
						<li>• Chronological readings</li>
						<li>• Consumption from deltas</li>
					</ul>
				</div>

				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<h2 className="mb-1 text-sm font-medium text-muted-foreground">
						Financial ledger
					</h2>
					<p className="mb-3 text-xs text-muted-foreground">
						Single-entry journal of all charges, payments, and adjustments.
					</p>
					<ul className="space-y-1 text-xs">
						<li>• Monthly charges per service</li>
						<li>• Tenant payments</li>
						<li>• Balance from SUM(amount)</li>
					</ul>
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-lg font-semibold">Monthly flat management</h1>
						<p className="text-sm text-muted-foreground">
							Select an address on the left to start configuring services,
							meters, and monthly charges.
						</p>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2 rounded-lg border bg-background p-4">
						<h2 className="text-sm font-medium">Configuration</h2>
						<p className="text-xs text-muted-foreground">
							Set up services, attach them to the selected property, and define
							versioned pricing rules.
						</p>
						<ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
							<li>Define rent and utility services.</li>
							<li>Configure fixed vs per-unit pricing.</li>
							<li>Schedule price changes safely over time.</li>
						</ul>
					</div>

					<div className="space-y-2 rounded-lg border bg-background p-4">
						<h2 className="text-sm font-medium">Operational flow</h2>
						<p className="text-xs text-muted-foreground">
							Each month, add meter readings, generate charges, and record
							payments into the ledger.
						</p>
						<ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
							<li>Capture meter readings for metered services.</li>
							<li>Generate monthly charges per service.</li>
							<li>Record tenant payments and monitor balance.</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}
