"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LEDGER_TYPE_OPTIONS, type LedgerFilters } from "@/lib/ledger-filters";

type MonthOption = { value: string; label: string };

function useFilterUrl() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return function setFilter(key: string, value: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (value === "") {
			params.delete(key);
		} else {
			params.set(key, value);
		}
		const qs = params.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname);
	};
}

export function LedgerFiltersPanel({
	monthOptions,
	filters,
}: {
	monthOptions: MonthOption[];
	filters: LedgerFilters;
}) {
	const setFilter = useFilterUrl();

	return (
		<div className="flex items-center gap-2">
			<label htmlFor="ledger-period" className="text-xs text-muted-foreground">
				Period
			</label>
			<select
				id="ledger-period"
				value={filters.period ?? ""}
				onChange={(e) => setFilter("period", e.target.value)}
				className="h-8 min-w-40 rounded-md border border-input bg-background px-2 text-xs"
			>
				<option value="">All periods</option>
				{monthOptions.map((m) => (
					<option key={m.value} value={m.value}>
						{m.label}
					</option>
				))}
			</select>

			<label htmlFor="ledger-type" className="text-xs text-muted-foreground">
				Type
			</label>
			<select
				id="ledger-type"
				value={filters.type ?? ""}
				onChange={(e) => setFilter("type", e.target.value)}
				className="h-8 min-w-40 rounded-md border border-input bg-background px-2 text-xs"
			>
				<option value="">All types</option>
				{LEDGER_TYPE_OPTIONS.map((t) => (
					<option key={t.value} value={t.value}>
						{t.label}
					</option>
				))}
			</select>
		</div>
	);
}
