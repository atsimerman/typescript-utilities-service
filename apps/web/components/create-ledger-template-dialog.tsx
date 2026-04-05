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
import { createLedgerEntryTemplate } from "@/app/actions/ledger-entry-templates";

type Service = {
	id: string;
	name: string;
	slug: string;
	type: string;
	parentId: string | null;
	createdAt: Date;
};

type TemplateLineInput = {
	tempId: string;
	entryType: "charge" | "payment";
	serviceId?: string;
};

export function CreateLedgerTemplateDialog({
	addressId,
	services,
}: {
	addressId: string;
	services: Service[];
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [name, setName] = React.useState("");
	const [lines, setLines] = React.useState<TemplateLineInput[]>([]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const result = await createLedgerEntryTemplate({
			addressId,
			name,
			lines: lines.map((l) => ({
				entryType: l.entryType,
				serviceId: l.serviceId,
			})),
		});

		if (result.error) {
			setError(result.error);
		} else {
			setOpen(false);
			setName("");
			setLines([]);
			router.refresh();
		}

		setLoading(false);
	}

	function addLine() {
		setLines([
			...lines,
			{
				tempId: Math.random().toString(36),
				entryType: "charge",
				serviceId: "",
			},
		]);
	}

	function removeLine(tempId: string) {
		setLines(lines.filter((l) => l.tempId !== tempId));
	}

	function updateLine(
		tempId: string,
		key: "entryType" | "serviceId",
		value: string
	) {
		setLines(
			lines.map((l) =>
				l.tempId === tempId ? { ...l, [key]: value } : l
			)
		);
	}

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
					<DialogTitle>Create ledger template</DialogTitle>
					<DialogDescription>
						Create a named preset of charges and payments.
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
							placeholder="e.g., Standard monthly charges"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">Lines</label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addLine}
							>
								<PlusIcon className="size-3 mr-1" />
								Add line
							</Button>
						</div>
						<div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
							{lines.length === 0 ? (
								<p className="text-xs text-muted-foreground p-2">
									No lines yet. Add one to get started.
								</p>
							) : (
								lines.map((line) => (
									<div
										key={line.tempId}
										className="flex gap-2 items-end p-2 border rounded bg-muted/50"
									>
										<div className="flex-1">
											<label className="text-xs font-medium block mb-1">
												Type
											</label>
											<select
												value={line.entryType}
												onChange={(e) =>
													updateLine(
														line.tempId,
														"entryType",
														e.target.value
													)
												}
												className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
											>
												<option value="charge">Charge</option>
												<option value="payment">Payment</option>
											</select>
										</div>
										<div className="flex-1">
											<label className="text-xs font-medium block mb-1">
												Service (optional)
											</label>
											<select
												value={line.serviceId || ""}
												onChange={(e) =>
													updateLine(
														line.tempId,
														"serviceId",
														e.target.value
													)
												}
												className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-xs"
											>
												<option value="">None</option>
												{services.map((s) => (
													<option key={s.id} value={s.id}>
														{s.name}
													</option>
												))}
											</select>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeLine(line.tempId)}
											className="h-8 px-2"
										>
											<X className="size-3" />
										</Button>
									</div>
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
						<Button type="submit" disabled={loading || lines.length === 0}>
							{loading ? "Creating..." : "Create template"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
