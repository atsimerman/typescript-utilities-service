"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	AddLedgerAdjustmentDialog,
	AddLedgerChargeDialog,
	AddLedgerPaymentDialog,
} from "@/components/ledger-dialogs";
import { AddLedgerFromTemplateButton } from "@/components/add-ledger-from-template-button";

type ServiceOption = { id: string; name: string };

type MonthOption = { value: string; label: string };

export function LedgerToolbar({
	addressId,
	services,
	monthOptions,
	currentPeriod,
}: {
	addressId: string;
	services: ServiceOption[];
	monthOptions: MonthOption[];
	currentPeriod?: string;
}) {
	const router = useRouter();
	const pathname = usePathname();

	function onPeriodChange(value: string) {
		if (value === "") {
			router.push(pathname);
		} else {
			router.push(`${pathname}?period=${encodeURIComponent(value)}`);
		}
	}

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
			<div className="flex items-center gap-2">
				<label htmlFor="ledger-period" className="text-xs text-muted-foreground">
					Period
				</label>
				<select
					id="ledger-period"
					value={currentPeriod ?? ""}
					onChange={(e) => onPeriodChange(e.target.value)}
					className="h-8 min-w-[10rem] rounded-md border border-input bg-background px-2 text-xs"
				>
					<option value="">All periods</option>
					{monthOptions.map((m) => (
						<option key={m.value} value={m.value}>
							{m.label}
						</option>
					))}
				</select>
			</div>
			<div className="flex flex-wrap gap-2">
				<AddLedgerChargeDialog addressId={addressId} services={services} />
				<AddLedgerPaymentDialog addressId={addressId} services={services} />
				<AddLedgerAdjustmentDialog addressId={addressId} services={services} />			<AddLedgerFromTemplateButton addressId={addressId} />			</div>
		</div>
	);
}
