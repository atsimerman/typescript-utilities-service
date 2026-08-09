import { type NextRequest, NextResponse } from "next/server";

/**
 * Layouts can't read the current pathname on the server (Next has no API for
 * it), so we stamp it onto a request header here for `(app)/layout.tsx` to
 * build a `redirectTo` for unauthenticated visitors. Auth itself is enforced
 * in the layout via `ensureSession` — if this proxy's matcher ever drifts out
 * of sync with the routes, the worst case is a missing deep-link redirect,
 * not an auth bypass.
 */
export function proxy(request: NextRequest) {
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(
		"x-pathname",
		request.nextUrl.pathname + request.nextUrl.search,
	);

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
