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
import { createMeterReading } from "@/app/actions/meter-readings";

export function AddReadingDialog({
	meterId,
	meterName,
	previousValue = 0,
}: {
	meterId: string;
	meterName: string;
	previousValue?: number;
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
		const readingDate = (formData.get("readingDate") as string) || "";
		const valueStr = (formData.get("value") as string) || "";
		const value = Number(valueStr);

		const result = await createMeterReading({
			meterId,
			readingDate,
			value,
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

	const defaultDate = new Date().toISOString().slice(0, 10);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-8 px-2 text-xs">
					<PlusIcon className="mr-1 size-3" />
					Add reading
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Add reading</DialogTitle>
					<DialogDescription>
						Record a meter reading for {meterName}. Value must be ≥ {previousValue} (previous/initial).
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="readingDate" className="text-sm font-medium">
							Date
						</label>
						<Input
							id="readingDate"
							name="readingDate"
							type="date"
							required
							defaultValue={defaultDate}
							className="h-9"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="value" className="text-sm font-medium">
							Value
						</label>
						<Input
							id="value"
							name="value"
							type="number"
							min={previousValue}
							required
							className="h-9"
						/>
					</div>

					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Adding…" : "Add reading"}
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
