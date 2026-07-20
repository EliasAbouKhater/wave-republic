import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VISITOR_COOKIE = "dl_visitor";
const SOURCE_COOKIE = "dl_source";
const VISITOR_TTL_DAYS = 30;
const VALID_SOURCES = new Set(["park", "bracelet", "resto", "direct"]);

// Anonymous visitor cookie + QR-source attribution.
// Runs on every customer request; skips API/static/backoffice.
// Next 16 renamed the middleware convention to "proxy".
export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Ensure visitor cookie exists
  if (!req.cookies.get(VISITOR_COOKIE)) {
    res.cookies.set({
      name: VISITOR_COOKIE,
      value: crypto.randomUUID(),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_TTL_DAYS * 24 * 60 * 60,
    });
  }

  // Capture ?src= on entry — sticky per-session cookie so subsequent
  // page views on the same visit inherit the attribution.
  const src = req.nextUrl.searchParams.get("src");
  if (src && VALID_SOURCES.has(src)) {
    res.cookies.set({
      name: SOURCE_COOKIE,
      value: src,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // Session cookie: no maxAge → cleared when browser closes
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Everything except backoffice, API, next internals, static files
    "/((?!backoffice|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
