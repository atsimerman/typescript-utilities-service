import { Breadcrumb, BreadcrumbList } from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@repo/ui/components/sidebar";
import { fetchAddresses } from "@/app/actions/addresses";
import { fetchCountries } from "@/app/actions/countries";
import { fetchCurrencies } from "@/app/actions/currencies";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbTitle } from "@/components/breadcrumb-title";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [addresses, countries, currencies] = await Promise.all([
		fetchAddresses(),
		fetchCountries(),
		fetchCurrencies(),
	]);

	return (
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
	);
}
