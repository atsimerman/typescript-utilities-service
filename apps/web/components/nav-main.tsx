"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@repo/ui/components/sidebar";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
	title: string;
	url: string;
	icon?: React.ReactNode;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
};

// Matches the exact route, or a nested route (e.g. /meters/123 for /meters).
function isRouteActive(pathname: string, url: string) {
	if (url === "/") return pathname === "/";
	return pathname === url || pathname.startsWith(`${url}/`);
}

function NavMainItem({ item, pathname }: { item: NavItem; pathname: string }) {
	const isActive =
		item.isActive ??
		item.items?.some((subItem) => isRouteActive(pathname, subItem.url)) ??
		false;

	const [open, setOpen] = useState(isActive);
	const [wasActive, setWasActive] = useState(isActive);

	// Expand the group when navigating into it, but still let the user collapse it manually.
	if (isActive !== wasActive) {
		setWasActive(isActive);
		if (isActive) setOpen(true);
	}

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="group/collapsible"
			render={<SidebarMenuItem />}
		>
			<CollapsibleTrigger
				render={<SidebarMenuButton tooltip={item.title} isActive={isActive} />}
			>
				{item.icon}
				<span>{item.title}</span>
				<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<SidebarMenuSub>
					{item.items?.map((subItem) => (
						<SidebarMenuSubItem key={subItem.title}>
							<SidebarMenuSubButton
								isActive={pathname === subItem.url}
								className="data-active:bg-sidebar-primary data-active:font-medium data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary/90 data-active:hover:text-sidebar-primary-foreground"
								render={<Link href={subItem.url} />}
							>
								<span>{subItem.title}</span>
							</SidebarMenuSubButton>
						</SidebarMenuSubItem>
					))}
				</SidebarMenuSub>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function NavMain({ items }: { items: NavItem[] }) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<NavMainItem key={item.title} item={item} pathname={pathname} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
