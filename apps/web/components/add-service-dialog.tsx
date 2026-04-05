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
import { createService } from "@/app/actions/create-service";

type ServiceGroup = {
	id: string;
	name: string;
};

type ServiceType = "group" | "fixed" | "metered";

export function AddServiceDialog({
	groups = [],
}: {
	groups?: ServiceGroup[];
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
		const name = (formData.get("name") as string) || "";
		const slug = (formData.get("slug") as string) || "";
		const type = (formData.get("type") as ServiceType | null) || "fixed";
		const parentId = (formData.get("parentId") as string) || null;

		const result = await createService({
			name,
			slug,
			type,
			parentId,
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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 px-2 text-xs">
					<PlusIcon className="mr-1 size-3" />
					Add service
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add service</DialogTitle>
					<DialogDescription>
						Define a reusable service for rent, utilities, or other charges.
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium">
							Name
						</label>
						<Input
							id="name"
							name="name"
							placeholder="Rent, Electricity, Internet"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="slug" className="text-sm font-medium">
							Slug
						</label>
						<Input
							id="slug"
							name="slug"
							placeholder="rent, electricity, internet"
							required
						/>
						<p className="text-xs text-muted-foreground">
							Unique identifier used internally and in reports.
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="type" className="text-sm font-medium">
								Type
							</label>
							<select
								id="type"
								name="type"
								required
								defaultValue="fixed"
								className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="fixed">Fixed</option>
								<option value="metered">Metered</option>
								<option value="group">Group</option>
							</select>
						</div>

						<div className="space-y-2">
							<label htmlFor="parentId" className="text-sm font-medium">
								Parent group
							</label>
							<select
								id="parentId"
								name="parentId"
								defaultValue=""
								className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">None</option>
								{groups.map((group) => (
									<option key={group.id} value={group.id}>
										{group.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex gap-2 pt-4">
						<Button type="submit" disabled={loading} className="h-8 px-3 text-xs">
							{loading ? "Creating..." : "Create service"}
						</Button>
						<DialogClose asChild>
							<Button
								type="button"
								variant="outline"
								className="h-8 px-3 text-xs"
							>
								Cancel
							</Button>
						</DialogClose>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

