import { ensureSession } from "@better-auth-ui/react/server";
import { Breadcrumb, BreadcrumbList } from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@repo/ui/components/sidebar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAddresses } from "@/app/actions/addresses";
import { fetchCountries } from "@/app/actions/countries";
import { fetchCurrencies } from "@/app/actions/currencies";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbTitle } from "@/components/breadcrumb-title";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const requestHeaders = await headers();
	const queryClient = getQueryClient();
	const session = await ensureSession(queryClient, auth, {
		headers: requestHeaders,
	});

	if (!session) {
		const redirectTo = requestHeaders.get("x-pathname") ?? "/";
		redirect(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const [addresses, countries, currencies] = await Promise.all([
		fetchAddresses(),
		fetchCountries(),
		fetchCurrencies(),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SidebarProvider>
				<AppSidebar
					addresses={addresses}
					countries={countries}
					currencies={currencies}
				/>
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbTitle />
								</BreadcrumbList>
							</Breadcrumb>
						</div>
					</header>
					{children}
				</SidebarInset>
			</SidebarProvider>
		</HydrationBoundary>
	);
}
