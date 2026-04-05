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
import { createAddressServiceConfig } from "@/app/actions/address-service-configs";

type ServiceOption = {
	id: string;
	name: string;
	type: string;
};

function firstDayOfCurrentMonth(): string {
	const d = new Date();
	d.setDate(1);
	return d.toISOString().slice(0, 10);
}

export function AttachServiceDialog({
	addressId,
	services = [],
	attachedServiceIds = [],
}: {
	addressId: string;
	services?: ServiceOption[];
	attachedServiceIds?: string[];
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const formRef = React.useRef<HTMLFormElement>(null);

	const selectableServices = services.filter(
		(s) =>
			(s.type === "fixed" || s.type === "metered") &&
			!attachedServiceIds.includes(s.id),
	);
	const [chosenServiceId, setChosenServiceId] = React.useState<string>("");
	const chosenService = services.find((s) => s.id === chosenServiceId);
	const isFixed = chosenService?.type === "fixed";
	const isMetered = chosenService?.type === "metered";

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const serviceId = (formData.get("serviceId") as string) || "";
		const activeFrom = (formData.get("activeFrom") as string) || "";
		const activeTo = (formData.get("activeTo") as string) || "";
		const fixedPriceRaw = formData.get("fixedPrice") as string;
		const pricePerUnitRaw = formData.get("pricePerUnit") as string;

		const fixedPrice =
			fixedPriceRaw !== "" && fixedPriceRaw != null
				? Math.round(parseFloat(fixedPriceRaw) * 100)
				: null;
		const pricePerUnit =
			pricePerUnitRaw !== "" && pricePerUnitRaw != null
				? Math.round(parseFloat(pricePerUnitRaw) * 100)
				: null;

		const result = await createAddressServiceConfig({
			addressId,
			serviceId,
			activeFrom,
			activeTo: activeTo || null,
			fixedPrice,
			pricePerUnit,
		});

		if (result.error) {
			setError(result.error);
		} else {
			setOpen(false);
			formRef.current?.reset();
			setChosenServiceId("");
			router.refresh();
		}

		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-8 px-2 text-xs">
					<PlusIcon className="mr-1 size-3" />
					Attach service
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Attach service &amp; set pricing</DialogTitle>
					<DialogDescription>
						Add a pricing version for a service at this address. Choose active
						dates and price (fixed or per unit).
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
							value={chosenServiceId}
							onChange={(e) => setChosenServiceId(e.target.value)}
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select a service</option>
							{selectableServices.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name} ({s.type})
								</option>
							))}
						</select>
						{selectableServices.length === 0 && (
							<p className="text-xs text-muted-foreground">
								All fixed/metered services are already attached. Add new
								services in the left column first.
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="activeFrom" className="text-sm font-medium">
								Active from
							</label>
							<Input
								id="activeFrom"
								name="activeFrom"
								type="date"
								required
								defaultValue={firstDayOfCurrentMonth()}
								className="h-9"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="activeTo" className="text-sm font-medium">
								Active to (optional)
							</label>
							<Input
								id="activeTo"
								name="activeTo"
								type="date"
								className="h-9"
							/>
						</div>
					</div>

					{isFixed && (
						<div className="space-y-2">
							<label htmlFor="fixedPrice" className="text-sm font-medium">
								Fixed price (e.g. 1800.00)
							</label>
							<Input
								id="fixedPrice"
								name="fixedPrice"
								type="number"
								step="0.01"
								min="0"
								required={isFixed}
								placeholder="0.00"
								className="h-9"
							/>
							<p className="text-xs text-muted-foreground">
								Amount per period in major units (e.g. 1800.00 for 1800.00
								currency).
							</p>
						</div>
					)}

					{isMetered && (
						<div className="space-y-2">
							<label htmlFor="pricePerUnit" className="text-sm font-medium">
								Price per unit (e.g. 0.90)
							</label>
							<Input
								id="pricePerUnit"
								name="pricePerUnit"
								type="number"
								step="0.01"
								min="0"
								required={isMetered}
								placeholder="0.00"
								className="h-9"
							/>
							<p className="text-xs text-muted-foreground">
								Price per consumption unit in major units.
							</p>
						</div>
					)}

					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading || selectableServices.length === 0}>
							{loading ? "Adding…" : "Add pricing version"}
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
