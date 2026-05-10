import { NextResponse } from "next/server";

/**
 * Baseline security headers for nationwide production deployments.
 * Keeps defaults safe without forcing a strict CSP (would break inline/HMR in dev).
 */
export function middleware() {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
