"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import {
	FileTextIcon,
	GaugeIcon,
	LandmarkIcon,
	Settings2Icon,
	WalletIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
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

// Navigation configuration for the billing app.
const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "/",
			icon: <LandmarkIcon />,
			isActive: true,
			items: [
				{
					title: "Overview",
					url: "/",
				},
				{
					title: "Monthly summary",
					url: "/summary",
				},
			],
		},
		{
			title: "Configuration",
			url: "/services",
			icon: <FileTextIcon />,
			items: [
				{
					title: "Services & pricing",
					url: "/services",
				},
				{
					title: "Meters",
					url: "/meters",
				},
			],
		},
		{
			title: "Meters",
			url: "/meters",
			icon: <GaugeIcon />,
			items: [
				{
					title: "Meter readings",
					url: "/meters",
				},
				{
					title: "Meter readings templates",
					url: "/meters/templates",
				},
			],
		},
		{
			title: "Ledger",
			url: "/ledger",
			icon: <WalletIcon />,
			items: [
				{
					title: "Charges & payments",
					url: "/ledger",
				},
				{
					title: "Ledger templates",
					url: "/ledger/templates",
				},
			],
		},
		{
			title: "Settings",
			url: "/settings",
			icon: <Settings2Icon />,
			items: [
				{
					title: "Profile & account",
					url: "/settings",
				},
			],
		},
	],
};

export function AppSidebar({
	addresses = [],
	countries = [],
	currencies = [],
	...props
}: {
	addresses?: Address[];
	countries?: Country[];
	currencies?: Currency[];
} & React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher
					addresses={addresses}
					countries={countries}
					currencies={currencies}
				/>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				{session?.user && <NavUser user={session.user} />}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
