import { fetchAddresses } from "@/app/actions/addresses";
import { fetchServices } from "@/app/actions/services";
import { fetchLedgerEntryTemplates } from "@/app/actions/ledger-entry-templates";
import { LedgerTemplatesManager } from "@/components/ledger-templates-manager";

export default async function LedgerTemplatesPage() {
	const addresses = await fetchAddresses();
	const activeAddress = addresses.at(0) ?? null;

	const [templates, services] = await Promise.all([
		activeAddress ? fetchLedgerEntryTemplates(activeAddress.id) : [],
		fetchServices(),
	]);

	const nonGroupServices = services.filter(
		(s: { type: string }) => s.type !== "group"
	);

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold">Ledger templates</h1>
				<p className="text-sm text-muted-foreground">
					Create named presets for charges and payments. When applied, add multiple
					entries with a shared period.
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
				<LedgerTemplatesManager
					addressId={activeAddress.id}
					services={nonGroupServices}
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
