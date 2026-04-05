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
import { useRouter } from "next/navigation";
import * as React from "react";
import { createLedgerEntry } from "@/app/actions/ledger-entries";

type ServiceOption = { id: string; name: string };

function currentMonthValue(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AddLedgerPaymentDialog({
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
		const period = (formData.get("period") as string) || "";
		const amount = Number(formData.get("amount") as string);
		const serviceId = (formData.get("serviceId") as string) || "";
		const note = (formData.get("note") as string) || "";

		const result = await createLedgerEntry({
			addressId,
			period,
			entryType: "payment",
			amountMajor: amount,
			serviceId: serviceId || null,
			note: note || null,
		});

		if (result.error) setError(result.error);
		else {
			setOpen(false);
			formRef.current?.reset();
			router.refresh();
		}
		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-8 text-xs">
					Add payment
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add payment</DialogTitle>
					<DialogDescription>
						Record a tenant payment. It is stored as a negative amount in the
						ledger.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<label htmlFor="pay-period" className="text-sm font-medium">
							Period (month)
						</label>
						<Input
							id="pay-period"
							name="period"
							type="month"
							required
							defaultValue={currentMonthValue()}
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="pay-amount" className="text-sm font-medium">
							Amount
						</label>
						<Input
							id="pay-amount"
							name="amount"
							type="number"
							step="0.01"
							min="0.01"
							required
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="pay-service" className="text-sm font-medium">
							Service (optional)
						</label>
						<select
							id="pay-service"
							name="serviceId"
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
							defaultValue=""
						>
							<option value="">—</option>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<label htmlFor="pay-note" className="text-sm font-medium">
							Note (optional)
						</label>
						<Input id="pay-note" name="note" className="h-9" />
					</div>
					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Saving…" : "Save payment"}
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

export function AddLedgerChargeDialog({
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
		const period = (formData.get("period") as string) || "";
		const amount = Number(formData.get("amount") as string);
		const serviceId = (formData.get("serviceId") as string) || "";
		const note = (formData.get("note") as string) || "";

		const result = await createLedgerEntry({
			addressId,
			period,
			entryType: "charge",
			amountMajor: amount,
			serviceId: serviceId || null,
			note: note || null,
		});

		if (result.error) setError(result.error);
		else {
			setOpen(false);
			formRef.current?.reset();
			router.refresh();
		}
		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 text-xs">
					Add charge
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add charge</DialogTitle>
					<DialogDescription>
						Record a charge (rent, utilities, etc.) for the selected month.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<label htmlFor="ch-period" className="text-sm font-medium">
							Period (month)
						</label>
						<Input
							id="ch-period"
							name="period"
							type="month"
							required
							defaultValue={currentMonthValue()}
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="ch-service" className="text-sm font-medium">
							Service (optional)
						</label>
						<select
							id="ch-service"
							name="serviceId"
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
							defaultValue=""
						>
							<option value="">—</option>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<label htmlFor="ch-amount" className="text-sm font-medium">
							Amount
						</label>
						<Input
							id="ch-amount"
							name="amount"
							type="number"
							step="0.01"
							min="0.01"
							required
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="ch-note" className="text-sm font-medium">
							Note (optional)
						</label>
						<Input id="ch-note" name="note" className="h-9" />
					</div>
					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Saving…" : "Save charge"}
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

export function AddLedgerAdjustmentDialog({
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
		const period = (formData.get("period") as string) || "";
		const amount = Number(formData.get("amount") as string);
		const serviceId = (formData.get("serviceId") as string) || "";
		const note = (formData.get("note") as string) || "";

		const result = await createLedgerEntry({
			addressId,
			period,
			entryType: "adjustment",
			amountMajor: amount,
			serviceId: serviceId || null,
			note: note || null,
		});

		if (result.error) setError(result.error);
		else {
			setOpen(false);
			formRef.current?.reset();
			router.refresh();
		}
		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="secondary" className="h-8 text-xs">
					Add adjustment
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add adjustment</DialogTitle>
					<DialogDescription>
						Correction or write-off. Use positive to increase balance owed,
						negative to decrease. Note is required.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<label htmlFor="adj-period" className="text-sm font-medium">
							Period (month)
						</label>
						<Input
							id="adj-period"
							name="period"
							type="month"
							required
							defaultValue={currentMonthValue()}
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="adj-amount" className="text-sm font-medium">
							Amount (signed)
						</label>
						<Input
							id="adj-amount"
							name="amount"
							type="number"
							step="0.01"
							required
							className="h-9"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="adj-service" className="text-sm font-medium">
							Service (optional)
						</label>
						<select
							id="adj-service"
							name="serviceId"
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
							defaultValue=""
						>
							<option value="">—</option>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<label htmlFor="adj-note" className="text-sm font-medium">
							Note
						</label>
						<Input id="adj-note" name="note" required className="h-9" />
					</div>
					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Saving…" : "Save adjustment"}
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
