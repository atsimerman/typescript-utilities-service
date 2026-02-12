import createAuth from "@repo/auth";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const auth = createAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
		const url = new URL("/auth/sign-in", request.url);
		url.searchParams.set("redirectTo", redirectTo);

		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/",
		"/account/:path*",
		// Add any other protected routes here
	],
};
