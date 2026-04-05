"use client";

import { Button } from "@repo/ui/components/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deleteMeterReadingTemplate } from "@/app/actions/meter-reading-templates";
import { EditMeterTemplateDialog } from "./edit-meter-template-dialog";
import { CreateMeterTemplateDialog } from "./create-meter-template-dialog";

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

type Template = {
	id: string;
	addressId: string;
	name: string;
	lineCount: number;
	createdAt: Date;
};

export function MeterTemplatesManager({
	addressId,
	meters,
	templates,
}: {
	addressId: string;
	meters: Meter[];
	templates: Template[];
}) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

	async function handleDelete(templateId: string) {
		setIsDeleting(templateId);
		const result = await deleteMeterReadingTemplate(templateId);
		setIsDeleting(null);

		if (result.error) {
			alert(`Error: ${result.error}`);
		} else {
			router.refresh();
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<CreateMeterTemplateDialog
					addressId={addressId}
					meters={meters}
				/>
			</div>

			{templates.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No templates yet. Create one to get started.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
					<table className="w-full text-sm">
						<thead className="border-b bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">
									Template name
								</th>
								<th className="px-4 py-3 text-left font-medium">
									Meters
								</th>
								<th className="px-4 py-3 text-right font-medium">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{templates.map((template) => (
								<tr
									key={template.id}
									className="border-b last:border-0 hover:bg-muted/50"
								>
									<td className="px-4 py-3">{template.name}</td>
									<td className="px-4 py-3 text-muted-foreground">
										{template.lineCount}{" "}
										{template.lineCount === 1 ? "meter" : "meters"}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex justify-end gap-2">
											<EditMeterTemplateDialog
												templateId={template.id}
												meters={meters}
												addressId={addressId}
											/>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(template.id)}
												disabled={isDeleting === template.id}
												className="text-destructive hover:text-destructive hover:bg-destructive/10"
											>
												<Trash2Icon className="size-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
