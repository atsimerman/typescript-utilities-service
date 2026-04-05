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
import { useRouter } from "next/navigation";
import * as React from "react";
import {
	fetchLedgerEntryTemplateWithLines,
	fetchLedgerEntryTemplates,
} from "@/app/actions/ledger-entry-templates";
import { createLedgerEntriesFromTemplate } from "@/app/actions/ledger-entries";

type Service = {
	id: string;
	name: string;
	type: string;
};

type TemplateLine = {
	id: string;
	entryType: "charge" | "payment";
	serviceName: string;
};

export function AddLedgerFromTemplateButton({
	addressId,
}: {
	addressId: string;
}) {
	const router = useRouter();
	const [templates, setTemplates] = React.useState<
		Array<{ id: string; name: string; lineCount: number }>
	>([]);
	const [selectedTemplate, setSelectedTemplate] =
		React.useState<typeof templates[number] | null>(null);
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		(async () => {
			const result = await fetchLedgerEntryTemplates(addressId);
			setTemplates(result);
		})();
	}, [addressId]);

	if (templates.length === 0) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="h-8 px-2 text-xs">
					Add ledger from template
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add ledger from template</DialogTitle>
					<DialogDescription>
						Select a template to add charges and payments with a shared period.
					</DialogDescription>
				</DialogHeader>

				{!selectedTemplate ? (
					<div className="space-y-2">
						{templates.map((template) => (
							<button
								key={template.id}
								onClick={() => setSelectedTemplate(template)}
								className="w-full p-3 text-left rounded border border-input hover:bg-muted/50 transition-colors"
							>
								<div className="font-medium">{template.name}</div>
								<div className="text-xs text-muted-foreground">
									{template.lineCount}{" "}
									{template.lineCount === 1 ? "line" : "lines"}
								</div>
							</button>
						))}
					</div>
				) : (
					<ApplyLedgerFromTemplateForm
						templateId={selectedTemplate.id}
						templateName={selectedTemplate.name}
						addressId={addressId}
						onClose={() => {
							setOpen(false);
							setSelectedTemplate(null);
							router.refresh();
						}}
						onBack={() => setSelectedTemplate(null)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ApplyLedgerFromTemplateForm({
	templateId,
	templateName,
	addressId,
	onClose,
	onBack,
}: {
	templateId: string;
	templateName: string;
	addressId: string;
	onClose: () => void;
	onBack: () => void;
}) {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [details, setDetails] = React.useState<string[] | null>(null);
	const [period, setPeriod] = React.useState(
		new Date().toISOString().slice(0, 7)
	);
	const [lines, setLines] = React.useState<TemplateLine[]>([]);
	const [values, setValues] = React.useState<Map<string, string>>(new Map());
	const [notes, setNotes] = React.useState<Map<string, string>>(new Map());
	const [isLoadingTemplate, setIsLoadingTemplate] = React.useState(true);

	React.useEffect(() => {
		loadTemplate();
	}, []);

	async function loadTemplate() {
		const template = await fetchLedgerEntryTemplateWithLines(templateId);
		if (template) {
			const templateLines = template.lines.map((line) => ({
				id: line.id,
				entryType: line.entryType as "charge" | "payment",
				serviceName: line.service?.name || "No service",
			}));
			setLines(templateLines);
		}
		setIsLoadingTemplate(false);
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setDetails(null);

		const submitRows = lines.map((line) => ({
			lineId: line.id,
			amountMajor: Number(values.get(line.id) || 0),
			note: notes.get(line.id) || undefined,
		}));

		const result = await createLedgerEntriesFromTemplate({
			templateId,
			period,
			rows: submitRows,
		});

		if (result.error) {
			setError(result.error);
			if ("details" in result && result.details) {
				setDetails(result.details);
			}
		} else {
			onClose();
		}

		setLoading(false);
	}

	if (isLoadingTemplate) {
		return <div className="py-8 text-center">Loading template...</div>;
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<div>{error}</div>
					{details && details.length > 0 && (
						<ul className="mt-2 ml-4 list-disc text-xs space-y-1">
							{details.map((detail, idx) => (
								<li key={idx}>{detail}</li>
							))}
						</ul>
					)}
				</div>
			)}

			<div className="space-y-2">
				<label htmlFor="period" className="text-sm font-medium">
					Period (month)
				</label>
				<Input
					id="period"
					type="month"
					value={period}
					onChange={(e) => setPeriod(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-2 py-2 max-h-48 overflow-y-auto border rounded p-3 bg-muted/50">
				{lines.map((line) => (
					<div key={line.id} className="space-y-1">
						<div className="flex items-center justify-between">
							<label className="text-xs font-medium">
								<span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground mr-2">
									{line.entryType === "charge" ? "Charge" : "Payment"}
								</span>
								{line.serviceName}
							</label>
						</div>
						<div className="flex gap-2">
							<input
								type="number"
								value={values.get(line.id) || ""}
								onChange={(e) => {
									const newValues = new Map(values);
									newValues.set(line.id, e.target.value);
									setValues(newValues);
								}}
								step="0.01"
								min="0"
								required
								placeholder="Amount"
								className="flex-1 h-8 rounded border border-input bg-background px-2 py-1 text-sm"
							/>
							<input
								type="text"
								value={notes.get(line.id) || ""}
								onChange={(e) => {
									const newNotes = new Map(notes);
									newNotes.set(line.id, e.target.value);
									setNotes(newNotes);
								}}
								placeholder="Note (optional)"
								className="flex-1 h-8 rounded border border-input bg-background px-2 py-1 text-sm"
							/>
						</div>
					</div>
				))}
			</div>

			<div className="flex gap-2 justify-end pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					disabled={loading}
				>
					Back
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? "Adding..." : "Add entries"}
				</Button>
			</div>
		</form>
	);
}
