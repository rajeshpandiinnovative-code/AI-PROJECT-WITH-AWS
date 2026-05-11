import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

import {
  canAccessManagementPath,
  canAccessSchoolAdminPath,
  isLearnerOrClassroomStaff,
  normalizeJwtRole,
} from "@/src/lib/middleware-route-roles";
import { IMPERSONATE_TENANT_COOKIE, founderEmail, mapRoleToAppRole } from "@/src/lib/rbac";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = await getToken({ req: request });

  if (
    !token &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/school") ||
      pathname.startsWith("/school-admin") ||
      pathname.startsWith("/management"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = mapRoleToAppRole(typeof token?.role === "string" ? token.role : undefined);
  const email = (typeof token?.email === "string" ? token.email : "").trim().toLowerCase();
  const isFounder = role === "SUPER_ADMIN" && email === founderEmail();

  if (pathname === "/dashboard") {
    if (isFounder) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/school/dashboard", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!isFounder) {
      return NextResponse.redirect(new URL("/school/dashboard", request.url));
    }

    const res = NextResponse.next();
    const tenantId = searchParams.get("tenantId");
    const clear = searchParams.get("clearImpersonation");
    if (clear === "1") {
      res.cookies.delete(IMPERSONATE_TENANT_COOKIE);
      return res;
    }
    if (tenantId) {
      const parsed = z.string().uuid().safeParse(tenantId.trim());
      if (parsed.success) {
        res.cookies.set(IMPERSONATE_TENANT_COOKIE, parsed.data, {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 8,
        });
      }
    }
    return res;
  }

  if (!token) {
    return NextResponse.next();
  }

  const jwtRole = normalizeJwtRole(token.role);

  if (pathname.startsWith("/management") || pathname.startsWith("/school-admin")) {
    if (isLearnerOrClassroomStaff(jwtRole)) {
      return NextResponse.redirect(new URL("/school/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/management")) {
    if (!canAccessManagementPath(jwtRole)) {
      return NextResponse.redirect(new URL("/school/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/school-admin")) {
    if (!canAccessSchoolAdminPath(jwtRole)) {
      return NextResponse.redirect(new URL("/school/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Use explicit segments so `/school/dashboard` always hits middleware before RSC (stable redirects + auth gate).
  matcher: [
    "/dashboard",
    "/admin/:path*",
    "/school/dashboard",
    "/school/:path*",
    "/school-admin",
    "/school-admin/:path*",
    "/management",
    "/management/:path*",
  ],
};
