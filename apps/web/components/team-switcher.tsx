"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@repo/ui/components/sidebar";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { AddAddressDialog } from "@/components/add-address-dialog";
import { authClient } from "@/lib/auth-client";

type Address = {
	id: string;
	label: string | null;
	userId: string;
	countryId: string;
	zipCode: string | null;
	city: string | null;
	street: string | null;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
};

type Country = {
	id: string;
	name: string;
	iso: string;
	createdAt: Date;
};

type Currency = {
	id: string;
	name: string;
	code: string;
	symbol: string;
	minorUnit: number;
	createdAt: Date;
};

export function TeamSwitcher({
	addresses = [],
	countries = [],
	currencies = [],
}: {
	addresses?: Address[];
	countries?: Country[];
	currencies?: Currency[];
}) {
	const { isMobile } = useSidebar();
	const { data: session } = authClient.useSession();

	const safeAddresses: Address[] = addresses || [];
	const [activeAddress, setActiveAddress] = React.useState<Address | null>(
		safeAddresses.at(0) ?? null,
	);

	const handleAddressAdded = () => {
		// Refresh the page to get the new address
		window.location.reload();
	};

	// If no addresses exist, show only Add button
	if (safeAddresses.length === 0) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					{session?.user ? (
						<AddAddressDialog
							userId={session.user.id}
							onSuccess={handleAddressAdded}
							countries={countries}
							currencies={currencies}
						/>
					) : (
						<button
							type="button"
							className="flex w-full gap-2 rounded-md border border-sidebar-border bg-transparent px-2 py-1.5 text-sm hover:bg-sidebar-accent"
							disabled
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<PlusIcon className="size-4" />
							</div>
							<div className="text-muted-foreground font-medium">
								Add address
							</div>
						</button>
					)}
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!activeAddress) {
		return null;
	}

	const displayLabel = activeAddress.label || activeAddress.city || "Address";
	const displayCity = activeAddress.city || activeAddress.street || "";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								{displayLabel.slice(0, 2).toUpperCase()}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{displayLabel}</span>
								<span className="truncate text-xs">{displayCity}</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Addresses
						</DropdownMenuLabel>
						{safeAddresses.map((address, index) => {
							const addrLabel = address.label || address.city || "Address";
							const addrCity = address.city || address.street || "";
							return (
								<DropdownMenuItem
									key={address.id}
									onClick={() => setActiveAddress(address)}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-md border font-semibold">
										{addrLabel.slice(0, 2).toUpperCase()}
									</div>
									<div className="flex flex-col flex-1">
										<span className="text-sm">{addrLabel}</span>
										<span className="text-xs text-muted-foreground">
											{addrCity}
										</span>
									</div>
									<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
								</DropdownMenuItem>
							);
						})}
						<DropdownMenuSeparator />
						{session?.user && (
							<div className="p-2">
								<AddAddressDialog
									userId={session.user.id}
									onSuccess={handleAddressAdded}
									countries={countries}
								/>
							</div>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
