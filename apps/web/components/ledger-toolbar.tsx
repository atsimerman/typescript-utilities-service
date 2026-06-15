"use client";

import { AddLedgerFromTemplateButton } from "@/components/add-ledger-from-template-button";
import {
	AddLedgerAdjustmentDialog,
	AddLedgerChargeDialog,
	AddLedgerPaymentDialog,
} from "@/components/ledger-dialogs";
import { LedgerFiltersPanel } from "@/components/ledger-filters-panel";
import { LedgerReceiptButton } from "@/components/ledger-receipt-button";
import type { LedgerFilters } from "@/lib/ledger-filters";

type ServiceOption = { id: string; name: string };
type MonthOption = { value: string; label: string };

export function LedgerToolbar({
	addressId,
	services,
	monthOptions,
	filters,
}: {
	addressId: string;
	services: ServiceOption[];
	monthOptions: MonthOption[];
	filters: LedgerFilters;
}) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
			<LedgerFiltersPanel monthOptions={monthOptions} filters={filters} />
			<div className="flex flex-wrap gap-2">
				<AddLedgerChargeDialog addressId={addressId} services={services} />
				<AddLedgerPaymentDialog addressId={addressId} services={services} />
				<AddLedgerAdjustmentDialog addressId={addressId} services={services} />
				<AddLedgerFromTemplateButton addressId={addressId} />
				<LedgerReceiptButton addressId={addressId} filters={filters} />
			</div>
		</div>
	);
}
