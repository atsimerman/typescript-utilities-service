"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import * as React from "react";
import { generateLedgerReceipt } from "@/app/actions/ledger-receipt";
import type { LedgerFilters } from "@/lib/ledger-filters";

export function LedgerReceiptButton({
	addressId,
	filters,
}: {
	addressId: string;
	filters: LedgerFilters;
}) {
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [receipt, setReceipt] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [copied, setCopied] = React.useState(false);

	async function handleGenerateReceipt() {
		setLoading(true);
		setError(null);
		setReceipt(null);

		try {
			const result = await generateLedgerReceipt({
				addressId,
				filters,
			});

			if (result.success) {
				setReceipt(result.receipt);
			} else {
				setError(result.error);
			}
		} catch (err) {
			setError("Failed to generate receipt");
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function handleCopy() {
		if (!receipt) return;

		try {
			await navigator.clipboard.writeText(receipt);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
			// Fallback: select text in textarea
			const textarea = document.querySelector(
				"[data-receipt-text]",
			) as HTMLTextAreaElement | null;
			if (textarea) {
				textarea.select();
			}
		}
	}

	return (
		<>
			<Button
				onClick={() => {
					setOpen(true);
					handleGenerateReceipt();
				}}
				variant="outline"
				size="sm"
			>
				Generate receipt
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Receipt message</DialogTitle>
						<DialogDescription>
							Copy the text and send it via a messenger
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{loading && (
							<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
								Generating receipt...
							</div>
						)}

						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						{receipt && (
							<>
								<div className="overflow-hidden rounded-md border bg-muted">
									<textarea
										readOnly
										value={receipt}
										className="h-72 w-full resize-none border-0 bg-muted p-3 font-mono text-xs outline-none"
										data-receipt-text
									/>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={handleCopy}
										variant={copied ? "default" : "outline"}
										size="sm"
										className="flex-1"
									>
										{copied ? "Copied to clipboard!" : "Copy to clipboard"}
									</Button>
									<Button
										onClick={() => setOpen(false)}
										variant="outline"
										size="sm"
									>
										Close
									</Button>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
