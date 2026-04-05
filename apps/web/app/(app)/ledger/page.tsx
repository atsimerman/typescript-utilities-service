import { fetchAddresses } from "@/app/actions/addresses";
import {
	fetchAddressCurrency,
	fetchLedgerEntries,
	sumLedgerAmountsForAddress,
} from "@/app/actions/ledger-entries";
import { fetchServices } from "@/app/actions/services";
import { LedgerToolbar } from "@/components/ledger-toolbar";
import { formatMinorAmount } from "@/lib/format-money";
import {
	ledgerEntryPeriodKey,
	normalizePeriodFirstDay,
} from "@/lib/ledger-period";

function formatPeriodLabel(period: Date | string): string {
	const key =
		typeof period === "string"
			? period.slice(0, 10)
			: period.toISOString().slice(0, 10);
	const parts = key.split("-");
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
		return key;
	}
	return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en", {
		month: "short",
		year: "numeric",
	});
}

function recentMonthOptions(count: number): { value: string; label: string }[] {
	const out: { value: string; label: string }[] = [];
	const d = new Date();
	for (let i = 0; i < count; i++) {
		const y = d.getFullYear();
		const m = d.getMonth() + 1;
		const value = `${y}-${String(m).padStart(2, "0")}`;
		const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en", {
			month: "short",
			year: "numeric",
		});
		out.push({ value, label });
		d.setMonth(d.getMonth() - 1);
	}
	return out;
}

export default async function LedgerPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
	const params = await searchParams;
	const [addresses, services] = await Promise.all([
		fetchAddresses(),
		fetchServices(),
	]);

	const activeAddress = addresses.at(0) ?? null;
	const currency = activeAddress
		? (await fetchAddressCurrency(activeAddress.id)) ?? {
				symbol: "",
				minorUnit: 2,
			}
		: { symbol: "", minorUnit: 2 };

	const allEntries = activeAddress
		? await fetchLedgerEntries(activeAddress.id)
		: [];

	const filterKey =
		params.period != null && params.period !== ""
			? normalizePeriodFirstDay(params.period)
			: null;

	let running = 0;
	const withRunning = allEntries.map((e) => {
		running += e.amount;
		return { ...e, runningBalance: running };
	});

	const displayed =
		filterKey != null
			? withRunning.filter(
					(e) => ledgerEntryPeriodKey(e.period) === filterKey,
				)
			: withRunning;

	const allTimeBalance = activeAddress
		? await sumLedgerAmountsForAddress(activeAddress.id)
		: 0;

	const periodNet = displayed.reduce((acc, e) => acc + e.amount, 0);

	const billableServices = services.filter((s) => s.type !== "group");
	const monthOptions = recentMonthOptions(24);
	const currentPeriod =
		filterKey != null ? params.period?.slice(0, 7) : undefined;

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Charges &amp; payments</h1>
				<p className="text-sm text-muted-foreground">
					Single ledger for the property. Balance is the sum of all amounts
					(charges and adjustments positive, payments negative).
				</p>
				{activeAddress && (
					<p className="text-xs text-muted-foreground">
						Ledger for{" "}
						<span className="font-medium">
							{activeAddress.label || activeAddress.city || "Address"}
						</span>
						.
					</p>
				)}
			</div>

			{!activeAddress ? (
				<div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
					Add an address in the sidebar to use the ledger.
				</div>
			) : (
				<div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								All-time balance
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{formatMinorAmount(allTimeBalance, currency)}
							</p>
							{filterKey != null && (
								<p className="text-xs text-muted-foreground">
									Net in selected month:{" "}
									<span className="font-medium text-foreground tabular-nums">
										{formatMinorAmount(periodNet, currency)}
									</span>
								</p>
							)}
						</div>
					</div>

					<LedgerToolbar
						addressId={activeAddress.id}
						services={billableServices.map((s) => ({
							id: s.id,
							name: s.name,
						}))}
						monthOptions={monthOptions}
						currentPeriod={currentPeriod}
					/>

					<div className="overflow-hidden rounded-lg border bg-background text-xs">
						{displayed.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								<p className="font-medium">
									{filterKey != null
										? "No entries in this month."
										: "No ledger entries yet."}
								</p>
								<p className="mt-1">
									Add a charge or payment using the buttons above.
								</p>
							</div>
						) : (
							<table className="w-full table-fixed border-collapse text-left">
								<colgroup>
									<col className="w-[11%]" />
									<col className="w-[10%]" />
									<col className="w-[16%]" />
									<col className="w-[8%]" />
									<col className="w-[11%]" />
									<col className="w-[14%]" />
									<col className="w-[18%]" />
									<col className="w-[12%]" />
								</colgroup>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Period
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Type
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Service
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Qty
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Unit
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Amount
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Note
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Running
										</th>
									</tr>
								</thead>
								<tbody>
									{displayed.map((row) => (
										<tr
											key={row.id}
											className="border-b border-border last:border-b-0"
										>
											<td className="whitespace-nowrap px-3 py-2 text-[11px]">
												{formatPeriodLabel(row.period)}
											</td>
											<td className="px-3 py-2 align-middle">
												<span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
													{row.entryType}
												</span>
											</td>
											<td className="max-w-0 px-3 py-2 text-[11px]">
												<span className="block truncate">
													{row.service?.name ?? "—"}
												</span>
											</td>
											<td className="px-3 py-2 text-right font-mono text-[11px]">
												{row.quantity != null ? row.quantity : "—"}
											</td>
											<td className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground">
												{row.unitPrice != null
													? formatMinorAmount(row.unitPrice, currency)
													: "—"}
											</td>
											<td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums">
												{formatMinorAmount(row.amount, currency)}
											</td>
											<td
												className="max-w-0 px-3 py-2 text-[10px] text-muted-foreground"
												title={row.note ?? undefined}
											>
												<span className="block truncate">
													{row.note ?? "—"}
												</span>
											</td>
											<td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
												{formatMinorAmount(row.runningBalance, currency)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>

					{filterKey != null && (
						<p className="text-[11px] text-muted-foreground">
							Running balance reflects the cumulative total after each row in
							chronological order (all periods). Filter only hides rows.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
