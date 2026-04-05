import { fetchAddresses } from "@/app/actions/addresses";
import { fetchMeterReadings } from "@/app/actions/meter-readings";
import { fetchMeters } from "@/app/actions/meters";
import { fetchServices } from "@/app/actions/services";
import { AddMeterDialog } from "@/components/add-meter-dialog";
import { AddReadingDialog } from "@/components/add-reading-dialog";
import { AddReadingsFromTemplateButton } from "@/components/add-readings-from-template-button";
import Link from "next/link";

function formatDate(date: Date | string | null) {
	if (!date) return "—";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().slice(0, 10);
}

export default async function MetersPage({
	searchParams,
}: {
	searchParams: Promise<{ meterId?: string }>;
}) {
	const params = await searchParams;
	const [addresses, services] = await Promise.all([
		fetchAddresses(),
		fetchServices(),
	]);

	const activeAddress = addresses.at(0) ?? null;
	const meters = activeAddress ? await fetchMeters(activeAddress.id) : [];
	const meteredServices = services.filter((s) => s.type === "metered");

	const selectedMeterId =
		params.meterId && meters.some((m) => m.id === params.meterId)
			? params.meterId
			: meters[0]?.id ?? null;
	const selectedMeter = selectedMeterId
		? meters.find((m) => m.id === selectedMeterId)
		: null;
	const readings = selectedMeterId
		? await fetchMeterReadings(selectedMeterId)
		: [];

	const readingsWithConsumption = readings.map((r, i) => {
		const prior = i === 0 ? null : readings[i - 1];
		const prev =
			i === 0 ? (selectedMeter?.initialReading ?? 0) : (prior?.value ?? 0);
		return {
			...r,
			consumption: r.value - prev,
		};
	});
	const lastReading = readings.at(-1);
	const lastValue = lastReading
		? lastReading.value
		: (selectedMeter?.initialReading ?? 0);

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Meters &amp; readings</h1>
				<p className="text-sm text-muted-foreground">
					Model physical meters for consumption-based services and track
					immutable readings over time.
				</p>
				{activeAddress && (
					<p className="text-xs text-muted-foreground">
						Configuring meters for{" "}
						<span className="font-medium">
							{activeAddress.label || activeAddress.city || "Address"}
						</span>
						.
					</p>
				)}
				{!activeAddress && (
					<p className="text-xs text-muted-foreground">
						Add an address first using the sidebar to manage meters.
					</p>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-[2fr,3fr]">
				<div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex items-center justify-between gap-2">
						<div>
							<h2 className="text-sm font-medium">Meters</h2>
							<p className="text-xs text-muted-foreground">
								Each meter belongs to an address and a metered service.
							</p>
						</div>
						{activeAddress && (
							<AddMeterDialog
								addressId={activeAddress.id}
								services={meteredServices.map((s) => ({
									id: s.id,
									name: s.name,
								}))}
							/>
						)}
					</div>

					<div className="mt-3 overflow-hidden rounded-lg border bg-background text-xs">
						{!activeAddress ? (
							<div className="p-4 text-muted-foreground">
								<div className="font-medium">No address selected.</div>
								<p className="mt-1">
									Select or add an address in the sidebar to manage meters.
								</p>
							</div>
						) : meters.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								<div className="font-medium">No meters for this address.</div>
								<p className="mt-1">
									Add a meter for a metered service (e.g. electricity, water).
								</p>
							</div>
						) : (
							<table className="w-full table-fixed border-collapse text-left">
								<colgroup>
									<col className="w-[26%]" />
									<col className="w-[12%]" />
									<col className="w-[12%]" />
									<col className="w-[16%]" />
									<col className="w-[16%]" />
									<col className="w-[18%]" />
								</colgroup>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Service / name
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Unit
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Initial
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Installed
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Removed
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									{meters.map((meter) => (
										<tr
											key={meter.id}
											className="border-b border-border last:border-b-0"
										>
											<td className="max-w-0 px-3 py-2 align-top text-[11px]">
												<div className="font-medium">{meter.name}</div>
												{meter.service && (
													<div className="mt-0.5 text-[10px] text-muted-foreground">
														{meter.service.name}
													</div>
												)}
											</td>
											<td className="px-3 py-2 align-middle font-mono text-[11px]">
												{meter.unit}
											</td>
											<td className="px-3 py-2 align-middle text-[11px]">
												{meter.initialReading}
											</td>
											<td className="whitespace-nowrap px-3 py-2 align-middle text-[11px]">
												{formatDate(meter.installedAt)}
											</td>
											<td className="whitespace-nowrap px-3 py-2 align-middle text-[11px]">
												{formatDate(meter.removedAt)}
											</td>
											<td className="px-3 py-2 align-middle text-right">
												<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
													{meter.active && !meter.removedAt
														? "Active"
														: "Removed"}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				<div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex items-center justify-between gap-2">
						<div>
							<h2 className="text-sm font-medium">Readings</h2>
							<p className="text-xs text-muted-foreground">
								Chronological, immutable meter readings. Consumption = value −
								previous.
							</p>
						</div>
						{selectedMeter && (
							<div className="flex gap-2">
								<AddReadingsFromTemplateButton addressId={activeAddress?.id || ""} />
								<AddReadingDialog
									meterId={selectedMeter.id}
									meterName={selectedMeter.name}
									previousValue={lastValue}
								/>
							</div>
						)}
					</div>

					{meters.length > 1 && (
						<div className="flex flex-wrap gap-1">
							<span className="text-[11px] text-muted-foreground">Meter:</span>
							{meters.map((m) => (
								<Link
									key={m.id}
									href={`/meters?meterId=${m.id}`}
									className={`rounded px-2 py-1 text-[11px] font-medium ${
										m.id === selectedMeterId
											? "bg-primary text-primary-foreground"
											: "bg-muted hover:bg-muted/80"
									}`}
								>
									{m.name}
								</Link>
							))}
						</div>
					)}

					<div className="mt-3 overflow-hidden rounded-lg border bg-background text-xs">
						{!selectedMeter ? (
							<div className="p-4 text-muted-foreground">
								Add a meter in the left column to view and add readings.
							</div>
						) : readings.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								No readings yet for {selectedMeter.name}. Add the first reading
								above.
							</div>
						) : (
							<table className="w-full table-fixed border-collapse text-left">
								<colgroup>
									<col className="w-[34%]" />
									<col className="w-[33%]" />
									<col className="w-[33%]" />
								</colgroup>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Date
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Value
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Consumption
										</th>
									</tr>
								</thead>
								<tbody>
									{readingsWithConsumption.map((r) => (
										<tr
											key={r.id}
											className="border-b border-border last:border-b-0"
										>
											<td className="whitespace-nowrap px-3 py-2 text-[11px]">
												{formatDate(r.readingDate)}
											</td>
											<td className="px-3 py-2 text-right font-mono text-[11px]">
												{r.value}
											</td>
											<td className="px-3 py-2 text-right font-mono text-[11px] text-muted-foreground">
												{r.consumption}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
