import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, getSession } from "@/lib/auth";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/invoice/view",
];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;

  // Allow public paths
  if (
    publicPaths.some(
      (publicPath) => path === publicPath || path.startsWith(publicPath + "/")
    )
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected paths
  const token = getSessionToken();
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = getSession(await token);
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("invoice_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};