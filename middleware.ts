import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

import {
  canAccessManagementPath,
  canAccessSchoolAdminPath,
  isJwtSuperAdmin,
  isLearnerOrClassroomStaff,
  normalizeJwtRole,
} from "@/src/lib/middleware-route-roles";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { IMPERSONATE_TENANT_COOKIE } from "@/src/lib/rbac";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = await getToken({ req: request });

  const roleDashboard = (role: unknown) =>
    primaryDashboardPathForPlatformRole(typeof role === "string" ? role : undefined);

  // Session required (not tied to demo mode / SHOW_DEMO — founder session grants access later).
  if (
    !token &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/school") ||
      pathname.startsWith("/school-admin") ||
      pathname.startsWith("/management") ||
      pathname.startsWith("/parent") ||
      pathname.startsWith("/student") ||
      pathname.startsWith("/teacher"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(roleDashboard(token?.role), request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!isJwtSuperAdmin(normalizeJwtRole(token?.role))) {
      return NextResponse.redirect(new URL(roleDashboard(token?.role), request.url));
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

  if (pathname.startsWith("/parent")) {
    if (jwtRole !== "parent" && !isJwtSuperAdmin(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/student")) {
    if (jwtRole !== "student" && !isJwtSuperAdmin(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/teacher")) {
    if (jwtRole !== "teacher" && !isJwtSuperAdmin(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/management") || pathname.startsWith("/school-admin")) {
    if (isLearnerOrClassroomStaff(jwtRole) && !isJwtSuperAdmin(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
    }
  }

  if (pathname.startsWith("/management")) {
    if (!canAccessManagementPath(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
    }
  }

  if (pathname.startsWith("/school-admin")) {
    if (!canAccessSchoolAdminPath(jwtRole)) {
      return NextResponse.redirect(new URL(roleDashboard(token.role), request.url));
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
    "/parent/:path*",
    "/student",
    "/student/:path*",
    "/teacher",
    "/teacher/:path*",
    "/founder/:path*",
  ],
};
