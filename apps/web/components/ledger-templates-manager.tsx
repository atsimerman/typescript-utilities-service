"use client";

import { Button } from "@repo/ui/components/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deleteLedgerEntryTemplate } from "@/app/actions/ledger-entry-templates";
import { EditLedgerTemplateDialog } from "./edit-ledger-template-dialog";
import { CreateLedgerTemplateDialog } from "./create-ledger-template-dialog";

type Service = {
	id: string;
	name: string;
	slug: string;
	type: string;
	parentId: string | null;
	createdAt: Date;
};

type Template = {
	id: string;
	addressId: string;
	name: string;
	lineCount: number;
	createdAt: Date;
};

export function LedgerTemplatesManager({
	addressId,
	services,
	templates,
}: {
	addressId: string;
	services: Service[];
	templates: Template[];
}) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

	async function handleDelete(templateId: string) {
		setIsDeleting(templateId);
		const result = await deleteLedgerEntryTemplate(templateId);
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
				<CreateLedgerTemplateDialog
					addressId={addressId}
					services={services}
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
									Lines
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
										{template.lineCount === 1 ? "line" : "lines"}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex justify-end gap-2">
											<EditLedgerTemplateDialog
												templateId={template.id}
												services={services}
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
