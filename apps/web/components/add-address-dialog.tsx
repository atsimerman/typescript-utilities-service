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
import * as React from "react";
import { createAddress } from "@/app/actions/create-address";

export function AddAddressDialog({
	userId,
	onSuccess,
	countries = [],
	currencies = [],
}: {
	userId: string;
	onSuccess?: () => void;
	countries?: Array<{ id: string; name: string }>;
	currencies?: Array<{ id: string; name: string }>;
}) {
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const formRef = React.useRef<HTMLFormElement>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const data = {
			label: formData.get("label") as string,
			street: formData.get("street") as string,
			city: formData.get("city") as string,
			zipCode: formData.get("zipCode") as string,
			countryId: formData.get("countryId") as string,
			currencyId: formData.get("currencyId") as string,
			userId,
		};

		const result = await createAddress(data);

		if (result.error) {
			setError(result.error);
		} else {
			setOpen(false);
			formRef.current?.reset();
			onSuccess?.();
		}

		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					className="flex w-full gap-2 rounded-md border border-sidebar-border bg-transparent px-2 py-1.5 text-sm hover:bg-sidebar-accent"
				>
					<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<PlusIcon className="size-4" />
					</div>
					<div className="text-muted-foreground font-medium">Add address</div>
				</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Address</DialogTitle>
					<DialogDescription>
						Enter your address details below.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="label" className="text-sm font-medium">
							Label (e.g., Home, Office)
						</label>
						<Input id="label" name="label" placeholder="e.g., Home" required />
					</div>

					<div className="space-y-2">
						<label htmlFor="street" className="text-sm font-medium">
							Street
						</label>
						<Input
							id="street"
							name="street"
							placeholder="123 Main Street"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="city" className="text-sm font-medium">
								City
							</label>
							<Input id="city" name="city" placeholder="New York" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="zipCode" className="text-sm font-medium">
								Zip Code
							</label>
							<Input id="zipCode" name="zipCode" placeholder="10001" required />
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="countryId" className="text-sm font-medium">
							Country
						</label>
						<select
							id="countryId"
							name="countryId"
							required
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
						>
							<option value="">Select a country</option>
							{countries.map((country) => (
								<option key={country.id} value={country.id}>
									{country.name}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label htmlFor="currencyId" className="text-sm font-medium">
							Currency
						</label>
						<select
							id="currencyId"
							name="currencyId"
							required
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
						>
							<option value="">Select a currency</option>
							{currencies.map((currency) => (
								<option key={currency.id} value={currency.id}>
									{currency.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-2 pt-4">
						<Button type="submit" disabled={loading}>
							{loading ? "Adding..." : "Add Address"}
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
