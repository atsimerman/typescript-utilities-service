"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createMeter } from "@/app/actions/meters";

type ServiceOption = { id: string; name: string };


export function AddMeterDialog({
	addressId,
	services = [],
}: {
	addressId: string;
	services?: ServiceOption[];
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const formRef = React.useRef<HTMLFormElement>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const serviceId = (formData.get("serviceId") as string) || "";
		const name = (formData.get("name") as string) || "";
		const unit = (formData.get("unit") as string) || "";
		const initialReading = (formData.get("initialReading") as string) || "0";
		const installedAt = (formData.get("installedAt") as string) || "";

		const result = await createMeter({
			addressId,
			serviceId,
			name,
			unit,
			initialReading: Number(initialReading),
			installedAt,
		});

		if (result.error) {
			setError(result.error);
		} else {
			setOpen(false);
			formRef.current?.reset();
			router.refresh();
		}

		setLoading(false);
	}

	const defaultInstalled = new Date().toISOString().slice(0, 10);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 px-2 text-xs">
					<PlusIcon className="mr-1 size-3" />
					Add meter
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add meter</DialogTitle>
					<DialogDescription>
						Register a physical meter for a metered service at this address.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="serviceId" className="text-sm font-medium">
							Service
						</label>
						<select
							id="serviceId"
							name="serviceId"
							required
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select a metered service</option>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium">
							Meter name
						</label>
						<Input
							id="name"
							name="name"
							placeholder="e.g. Main electricity"
							required
							className="h-9"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="unit" className="text-sm font-medium">
							Unit
						</label>
						<Input
							id="unit"
							name="unit"
							placeholder="e.g. kWh, m³"
							required
							className="h-9"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="initialReading" className="text-sm font-medium">
								Initial reading
							</label>
							<Input
								id="initialReading"
								name="initialReading"
								type="number"
								min="0"
								defaultValue="0"
								className="h-9"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="installedAt" className="text-sm font-medium">
								Installed at
							</label>
							<Input
								id="installedAt"
								name="installedAt"
								type="date"
								required
								defaultValue={defaultInstalled}
								className="h-9"
							/>
						</div>
					</div>

					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Adding…" : "Add meter"}
						</Button>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
