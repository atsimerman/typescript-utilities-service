"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AuthUIProvider
				authClient={authClient}
				navigate={router.push}
				replace={router.replace}
				onSessionChange={() => {
					// Clear router cache (protected routes)
					router.refresh();
				}}
				organization={false}
				Link={Link}
			>
				<TooltipProvider>{children}</TooltipProvider>
				<Toaster />
			</AuthUIProvider>
		</ThemeProvider>
	);
}
