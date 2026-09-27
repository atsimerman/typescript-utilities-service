import { fetchAddresses } from "@/app/actions/addresses";
import {
	fetchAddressCurrency,
	fetchLedgerEntries,
	sumLedgerAmountsForAddress,
} from "@/app/actions/ledger-entries";
import { fetchServices } from "@/app/actions/services";
import { LedgerToolbar } from "@/components/ledger-toolbar";
import { formatMonth } from "@/lib/format-date";
import { formatMinorAmount, type MoneyFormat } from "@/lib/format-money";
import {
	applyFilters,
	isFiltered,
	parseLedgerFilters,
} from "@/lib/ledger-filters";

function recentMonthOptions(
	count: number,
	locale: string | null | undefined,
): { value: string; label: string }[] {
	const out: { value: string; label: string }[] = [];
	const d = new Date();
	for (let i = 0; i < count; i++) {
		const y = d.getFullYear();
		const m = d.getMonth() + 1;
		const value = `${y}-${String(m).padStart(2, "0")}`;
		out.push({ value, label: formatMonth(value, locale, "short") });
		d.setMonth(d.getMonth() - 1);
	}
	return out;
}

export default async function LedgerPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; type?: string }>;
}) {
	const params = await searchParams;
	const [addresses, services] = await Promise.all([
		fetchAddresses(),
		fetchServices(),
	]);

	const activeAddress = addresses.at(0) ?? null;
	const currency: MoneyFormat = activeAddress
		? ((await fetchAddressCurrency(activeAddress.id)) ?? {
				symbol: "",
				minorUnit: 2,
			})
		: { symbol: "", minorUnit: 2 };

	const allEntries = activeAddress
		? await fetchLedgerEntries(activeAddress.id)
		: [];

	const filters = parseLedgerFilters(params);

	let running = 0;
	const withRunning = allEntries.map((e) => {
		running += e.amount;
		return { ...e, runningBalance: running };
	});

	const displayed = applyFilters(withRunning, filters);
	const allTimeBalance = activeAddress
		? await sumLedgerAmountsForAddress(activeAddress.id)
		: 0;
	const filteredNet = displayed.reduce((acc, e) => acc + e.amount, 0);
	const billableServices = services.filter((s) => s.type !== "group");
	const monthOptions = recentMonthOptions(24, currency.locale);

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
							{isFiltered(filters) && (
								<p className="text-xs text-muted-foreground">
									Filtered net:{" "}
									<span className="font-medium text-foreground tabular-nums">
										{formatMinorAmount(filteredNet, currency)}
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
						filters={filters}
					/>

					<div className="overflow-hidden rounded-lg border bg-background text-xs">
						{displayed.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								<p className="font-medium">
									{isFiltered(filters)
										? "No entries match the current filters."
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
												{formatMonth(row.period, currency.locale, "short")}
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

					{isFiltered(filters) && (
						<p className="text-[11px] text-muted-foreground">
							Running balance reflects the cumulative total after each row in
							chronological order (all entries). Filters only hide rows.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
