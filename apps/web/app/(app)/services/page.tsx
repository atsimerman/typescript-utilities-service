import { fetchAddressServiceConfigs } from "@/app/actions/address-service-configs";
import { fetchAddresses } from "@/app/actions/addresses";
import { fetchServices } from "@/app/actions/services";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { AttachServiceDialog } from "@/components/attach-service-dialog";

function formatDate(date: Date | string | null) {
	if (!date) return "—";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().slice(0, 10);
}

function formatMoney(minor: number | null | undefined) {
	if (minor == null) return "—";
	return (minor / 100).toFixed(2);
}

function getConfigStatus(config: {
	activeFrom: Date | string;
	activeTo: Date | string | null;
}) {
	const today = new Date();
	const from = typeof config.activeFrom === "string" ? new Date(config.activeFrom) : config.activeFrom;
	const to = config.activeTo == null ? null : typeof config.activeTo === "string" ? new Date(config.activeTo) : config.activeTo;

	if (from <= today && (!to || to >= today)) return "Current";
	if (from > today) return "Future";
	return "Past";
}

export default async function ServicesPage() {
	const [addresses, services] = await Promise.all([
		fetchAddresses(),
		fetchServices(),
	]);

	const activeAddress = addresses.at(0) ?? null;

	const configs = activeAddress
		? await fetchAddressServiceConfigs(activeAddress.id)
		: [];

	const groupServices = services.filter((service) => service.type === "group");
	const attachedServiceIds = [
		...new Set(configs.map((c) => c.serviceId)),
	];

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Services &amp; pricing</h1>
				<p className="text-sm text-muted-foreground">
					Define rent and utility services and attach versioned pricing to the
					selected property.
				</p>
				{activeAddress && (
					<p className="text-xs text-muted-foreground">
						Configuring pricing for{" "}
						<span className="font-medium">
							{activeAddress.label || activeAddress.city || "Address"}
						</span>
						.
					</p>
				)}
				{!activeAddress && (
					<p className="text-xs text-muted-foreground">
						Add an address first using the sidebar, then configure its services
						and pricing here.
					</p>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-[2fr,3fr]">
				<div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex items-center justify-between gap-2">
						<div>
							<h2 className="text-sm font-medium">Services</h2>
							<p className="text-xs text-muted-foreground">
								Service catalog used across all properties.
							</p>
						</div>
						<AddServiceDialog
							groups={groupServices.map((service) => ({
								id: service.id,
								name: service.name,
							}))}
						/>
					</div>

					<div className="mt-3 overflow-hidden rounded-lg border bg-background text-xs">
						{services.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								<div className="font-medium">No services defined yet.</div>
								<p className="mt-1">
									Add services such as Rent, Electricity, Water, or Internet to
									use them across your properties.
								</p>
							</div>
						) : (
							<table className="w-full table-fixed border-collapse text-left">
								<colgroup>
									<col className="w-[40%]" />
									<col className="w-[18%]" />
									<col className="w-[28%]" />
									<col className="w-[14%]" />
								</colgroup>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Name
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Type
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Slug
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Created
										</th>
									</tr>
								</thead>
								<tbody>
									{services.map((service) => (
										<tr
											key={service.id}
											className="border-b border-border last:border-b-0"
										>
											<td className="max-w-0 px-3 py-2 text-[11px] font-medium">
												<span className="block truncate">{service.name}</span>
											</td>
											<td className="px-3 py-2 align-middle">
												<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
													{service.type}
												</span>
											</td>
											<td className="max-w-0 px-3 py-2 font-mono text-[10px] text-muted-foreground">
												<span className="block truncate">{service.slug}</span>
											</td>
											<td className="whitespace-nowrap px-3 py-2 text-right text-[10px] text-muted-foreground">
												{formatDate(service.createdAt)}
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
							<h2 className="text-sm font-medium">Pricing versions</h2>
							<p className="text-xs text-muted-foreground">
								Versioned pricing configuration with effective date ranges per
								service and property.
							</p>
						</div>
						{activeAddress && (
							<AttachServiceDialog
								addressId={activeAddress.id}
								services={services.map((s) => ({
									id: s.id,
									name: s.name,
									type: s.type,
								}))}
								attachedServiceIds={attachedServiceIds}
							/>
						)}
					</div>

					<div className="mt-3 overflow-hidden rounded-lg border bg-background text-xs">
						{!activeAddress ? (
							<div className="p-4 text-muted-foreground">
								<div className="font-medium">
									No address selected for pricing.
								</div>
								<p className="mt-1">
									Select or add an address in the sidebar to configure its
									services and pricing.
								</p>
							</div>
						) : configs.length === 0 ? (
							<div className="p-4 text-muted-foreground">
								<div className="font-medium">
									No services configured for this address.
								</div>
								<p className="mt-1">
									Attach services and define their pricing periods to start
									billing this property.
								</p>
							</div>
						) : (
							<table className="w-full table-fixed border-collapse text-left">
								<colgroup>
									<col className="w-[32%]" />
									<col className="w-[14%]" />
									<col className="w-[14%]" />
									<col className="w-[24%]" />
									<col className="w-[16%]" />
								</colgroup>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Service
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Active from
										</th>
										<th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Active to
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Fixed / unit
										</th>
										<th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									{configs.map((config) => (
										<tr
											key={config.id}
											className="border-b border-border last:border-b-0"
										>
											<td className="max-w-0 px-3 py-2 align-top text-[11px]">
												<div className="font-medium">
													{config.service?.name ?? "Unknown service"}
												</div>
												{config.service && (
													<div className="mt-0.5 text-[10px] text-muted-foreground">
														<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium capitalize">
															{config.service.type}
														</span>
													</div>
												)}
											</td>
											<td className="whitespace-nowrap px-3 py-2 align-middle text-[11px]">
												{formatDate(config.activeFrom)}
											</td>
											<td className="whitespace-nowrap px-3 py-2 align-middle text-[11px]">
												{formatDate(config.activeTo)}
											</td>
											<td className="px-3 py-2 align-middle text-right text-[11px]">
												<div>{formatMoney(config.fixedPrice)}</div>
												<div className="text-[10px] text-muted-foreground">
													{config.pricePerUnit != null
														? `${formatMoney(config.pricePerUnit)} / unit`
														: "—"}
												</div>
											</td>
											<td className="px-3 py-2 align-middle text-right">
												<span className="inline-flex items-center justify-end rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
													{getConfigStatus(config)}
												</span>
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
