import { fetchAddresses } from "@/app/actions/addresses";
import { fetchMeters } from "@/app/actions/meters";
import { fetchMeterReadingTemplates } from "@/app/actions/meter-reading-templates";
import { MeterTemplatesManager } from "@/components/meter-templates-manager";

export default async function MeterTemplatesPage() {
	const addresses = await fetchAddresses();
	const activeAddress = addresses.at(0) ?? null;

	const [meters, templates] = await Promise.all([
		activeAddress ? fetchMeters(activeAddress.id) : [],
		activeAddress ? fetchMeterReadingTemplates(activeAddress.id) : [],
	]);

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Meter readings templates</h1>
				<p className="text-sm text-muted-foreground">
					Create named presets of multiple meters. When applied, add readings for
					all meters in one dialog.
				</p>
				{activeAddress && (
					<p className="text-xs text-muted-foreground">
						Managing templates for{" "}
						<span className="font-medium">
							{activeAddress.label || activeAddress.city || "Address"}
						</span>
						.
					</p>
				)}
				{!activeAddress && (
					<p className="text-xs text-muted-foreground">
						Add an address first using the sidebar to manage templates.
					</p>
				)}
			</div>

			{activeAddress ? (
				<MeterTemplatesManager
					addressId={activeAddress.id}
					meters={meters}
					templates={templates}
				/>
			) : (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No address selected
					</p>
				</div>
			)}
		</div>
	);
}
