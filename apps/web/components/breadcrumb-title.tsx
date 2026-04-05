"use client";

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { usePathname } from "next/navigation";

export function BreadcrumbTitle() {
	const pathname = usePathname();

	if (pathname === "/") {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Overview</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	if (pathname.startsWith("/services")) {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Services &amp; pricing</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	if (pathname.startsWith("/meters/templates")) {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/meters">Meters</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Meter readings templates</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	if (pathname.startsWith("/meters")) {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Meters &amp; readings</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	if (pathname.startsWith("/ledger/templates")) {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/ledger">Ledger</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Ledger templates</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	if (pathname.startsWith("/ledger")) {
		return (
			<>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>Charges &amp; payments</BreadcrumbPage>
				</BreadcrumbItem>
			</>
		);
	}

	return (
		<BreadcrumbItem className="hidden md:block">
			<BreadcrumbLink href="/">Property billing</BreadcrumbLink>
		</BreadcrumbItem>
	);
}
