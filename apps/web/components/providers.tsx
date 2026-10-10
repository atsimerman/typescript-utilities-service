"use client";

import { AuthProvider } from "@repo/ui/components/auth/auth-provider";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();
	const queryClient = getQueryClient();

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<AuthProvider
					authClient={authClient}
					redirectTo="/"
					localization={{
						// Email changes apply immediately (no verification email is sent).
						settings: { changeEmailSuccess: "Email updated" },
					}}
					navigate={({ to, replace }) =>
						replace ? router.replace(to) : router.push(to)
					}
					Link={Link}
				>
					<TooltipProvider>{children}</TooltipProvider>
					<Toaster />
				</AuthProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
