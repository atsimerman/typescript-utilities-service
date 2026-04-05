"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { PlusIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createMeterReadingTemplate } from "@/app/actions/meter-reading-templates";

type Meter = {
	id: string;
	name: string;
	unit: string;
	addressId: string;
	serviceId: string;
	initialReading: number;
	installedAt: string;
	removedAt: string | null;
	active: boolean;
	createdAt: Date;
	service?: { id: string; name: string } | null;
};

export function CreateMeterTemplateDialog({
	addressId,
	meters,
}: {
	addressId: string;
	meters: Meter[];
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [name, setName] = React.useState("");
	const [selectedMeterIds, setSelectedMeterIds] = React.useState<Set<string>>(
		new Set()
	);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const result = await createMeterReadingTemplate({
			addressId,
			name,
			meterIds: Array.from(selectedMeterIds),
		});

		if (result.error) {
			setError(result.error);
		} else {
			setOpen(false);
			setName("");
			setSelectedMeterIds(new Set());
			router.refresh();
		}

		setLoading(false);
	}

	function toggleMeter(meterId: string) {
		const newSet = new Set(selectedMeterIds);
		if (newSet.has(meterId)) {
			newSet.delete(meterId);
		} else {
			newSet.add(meterId);
		}
		setSelectedMeterIds(newSet);
	}

	const activeMeterCount = Array.from(selectedMeterIds).length;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 px-2 text-xs">
					<PlusIcon className="mr-1 size-3" />
					Create template
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create meter template</DialogTitle>
					<DialogDescription>
						Create a named preset of meters for quick readings.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium">
							Template name
						</label>
						<Input
							id="name"
							placeholder="e.g., Monthly utility read"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							Meters ({activeMeterCount} selected)
						</label>
						<div className="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
							{meters.length === 0 ? (
								<p className="text-xs text-muted-foreground p-2">
									No meters available
								</p>
							) : (
								meters.map((meter) => (
									<label
										key={meter.id}
										className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted text-sm"
									>
										<input
											type="checkbox"
											checked={selectedMeterIds.has(meter.id)}
											onChange={() => toggleMeter(meter.id)}
											className="rounded"
										/>
										<span className="flex-1">
											{meter.name}
											<span className="text-xs text-muted-foreground ml-2">
												({meter.unit})
											</span>
										</span>
									</label>
								))
							)}
						</div>
					</div>

					<div className="flex gap-2 justify-end pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || activeMeterCount === 0}>
							{loading ? "Creating..." : "Create template"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
