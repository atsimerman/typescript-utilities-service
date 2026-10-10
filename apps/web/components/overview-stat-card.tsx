export function OverviewStatCard({
	title,
	value,
	hint,
	tone,
}: {
	title: string;
	value: string;
	hint?: string;
	tone?: "debt" | "ok";
}) {
	const toneClass =
		tone === "debt"
			? "text-destructive"
			: tone === "ok"
				? "text-emerald-600 dark:text-emerald-400"
				: "";
	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{title}
			</h2>
			<p className={`mt-1 text-xl font-semibold tabular-nums ${toneClass}`}>
				{value}
			</p>
			{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}
