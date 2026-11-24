import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

/** Old flat tab routes → /projects/:id/:tab after the project-scoped restructure. */
const LEGACY_PROJECT_TABS = new Set([
  "survey",
  "schedule",
  "procurement",
  "notes",
  "fat",
  "install",
  "commis",
  "sat",
  "training",
  "support",
  "handover",
  "costing",
  "execution",
  "documents",
]);

/**
 * Cheap first gate: no session cookie means go to /login.
 * The real session check happens in the app layout (requireUser).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const open = pathname === "/login" || pathname.startsWith("/api/auth");
  const hasCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasCookie && !open) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tab = pathname.replace(/^\//, "");
  if (LEGACY_PROJECT_TABS.has(tab)) {
    const projectId = request.cookies.get("pct_project")?.value;
    const target = projectId
      ? `/projects/${projectId}/${tab}`
      : "/projects";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
