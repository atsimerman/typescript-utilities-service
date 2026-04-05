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
	fetchMeterReadingTemplateWithLines,
	fetchMeterReadingTemplates,
} from "@/app/actions/meter-reading-templates";
import { createMeterReadingsFromTemplate } from "@/app/actions/meter-readings";
import { ChevronDownIcon } from "lucide-react";

type Meter = {
	id: string;
	name: string;
	unit: string;
	initialReading: number;
};

type TemplateRow = {
	meterId: string;
	name: string;
	unit: string;
	previousValue: number;
};

export function AddReadingsFromTemplateButton({
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
			const result = await fetchMeterReadingTemplates(addressId);
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
					Add readings from template
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add readings from template</DialogTitle>
					<DialogDescription>
						Select a template to add readings for multiple meters at once.
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
									{template.lineCount === 1 ? "meter" : "meters"}
								</div>
							</button>
						))}
					</div>
				) : (
					<ApplyReadingsFromTemplateForm
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

function ApplyReadingsFromTemplateForm({
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
	const [readingDate, setReadingDate] = React.useState(
		new Date().toISOString().slice(0, 10)
	);
	const [rows, setRows] = React.useState<TemplateRow[]>([]);
	const [values, setValues] = React.useState<Map<string, string>>(new Map());
	const [isLoadingTemplate, setIsLoadingTemplate] = React.useState(true);

	React.useEffect(() => {
		loadTemplate();
	}, []);

	async function loadTemplate() {
		const template = await fetchMeterReadingTemplateWithLines(templateId);
		if (template) {
			const templateRows = template.lines.map((line) => ({
				meterId: line.meterId,
				name: line.meter?.name || "Unknown",
				unit: line.meter?.unit || "",
				previousValue: line.meter?.initialReading || 0,
			}));
			setRows(templateRows);
		}
		setIsLoadingTemplate(false);
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setDetails(null);

		const submitValues = rows.map((row) => ({
			meterId: row.meterId,
			value: Number(values.get(row.meterId) || 0),
		}));

		const result = await createMeterReadingsFromTemplate({
			templateId,
			readingDate,
			values: submitValues,
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

			<div className="space-y-2 py-2 max-h-48 overflow-y-auto border rounded p-3 bg-muted/50">
				{rows.map((row) => (
					<div key={row.meterId} className="flex items-end gap-2">
						<div className="flex-1">
							<label className="text-xs font-medium block mb-1">
								{row.name}
								<span className="text-muted-foreground"> ({row.unit})</span>
							</label>
							<input
								type="number"
								value={values.get(row.meterId) || ""}
								onChange={(e) => {
									const newValues = new Map(values);
									newValues.set(row.meterId, e.target.value);
									setValues(newValues);
								}}
								min={row.previousValue}
								required
								className="w-full h-8 rounded border border-input bg-background px-2 py-1 text-sm"
								placeholder={`Min: ${row.previousValue}`}
							/>
						</div>
					</div>
				))}
			</div>

			<div className="space-y-2">
				<label htmlFor="readingDate" className="text-sm font-medium">
					Reading date
				</label>
				<Input
					id="readingDate"
					type="date"
					value={readingDate}
					onChange={(e) => setReadingDate(e.target.value)}
					required
				/>
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
					{loading ? "Adding..." : "Add readings"}
				</Button>
			</div>
		</form>
	);
}
