import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LinksManager = [
  "/client/dashboard/supervisor/asset-status",
  "/client/dashboard/manager/survey-report",
  "/client/dashboard/manager/cleaning-report",
  "/client/dashboard/manager/reports-by-variation",
  "/client/dashboard/manager/survey-report-action",
];

const LinksSupervisor = [
  "/client/dashboard/supervisor/asset-status",
  "/client/dashboard/manager/reports-by-variation",
  "/client/dashboard/manager/survey-report-action",
];

const LinksCleaner = ["/client/dashboard/supervisor/asset-status"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude specific paths (e.g., login and not-authorized)
  if (pathname.startsWith("/client/auth/login") || pathname.startsWith("/not-authorized")) {
    return NextResponse.next(); // Allow access to these routes
  }

  // Retrieve user cookie (this assumes you're storing user info in cookies)
  const userCookie = request.cookies.get("user");

  // If no user data is found, redirect to login
  if (!userCookie) {
    return NextResponse.redirect(new URL("/client/auth/login", request.url));
  }

  // Parse user data from cookie
  let user;
  try {
    user = JSON.parse(userCookie.value);
  } catch (error) {
    console.error("Error parsing user cookie:", error);
    return NextResponse.redirect(new URL("/client/auth/login", request.url)); // Redirect to login on cookie parse failure
  }

  // Check user's role and restrict access based on the user's role
  const role = user?.role;

  if (role === "manager" && !LinksManager.includes(pathname)) {
    return NextResponse.redirect(new URL("/not-authorized", request.url));
  }

  if (role === "supervisor" && !LinksSupervisor.includes(pathname)) {
    return NextResponse.redirect(new URL("/not-authorized", request.url));
  }

  if (role === "cleaner" && !LinksCleaner.includes(pathname)) {
    return NextResponse.redirect(new URL("/not-authorized", request.url));
  }

  // If the user is authenticated and their role matches, allow access
  return NextResponse.next();
}

// Apply the middleware to all routes (paths that start with /client and /server)
export const config = {
  matcher: [
    "/client/dashboard/:path*", // Protect all routes under /client
    // "/server/api/:path*", // Protect all API routes
    // "/",              // Protect home page or root
  ],
};
