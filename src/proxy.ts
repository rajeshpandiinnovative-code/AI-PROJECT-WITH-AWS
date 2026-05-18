import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";
import { UserRole } from "./types/roles";

// Create a lightweight auth instance for the Proxy
const { auth } = NextAuth(authConfig);

const ROLE_ROUTES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '/(super)',
  [UserRole.MANAGEMENT]: '/(admin)/management',
  [UserRole.PRINCIPAL]: '/(admin)/principal',
  [UserRole.SCHOOL_ADMIN]: '/(admin)/school-admin',
  [UserRole.TEACHER]: '/(instructor)',
  [UserRole.PARENT]: '/(guardian)',
  [UserRole.STUDENT]: '/(student)',
  [UserRole.GUEST]: '/(auth)/login',
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user?.role as UserRole) || UserRole.GUEST;

  const isAuthPage = nextUrl.pathname.startsWith('/(auth)');
  
  // If logged in and trying to access login page, redirect to dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL(ROLE_ROUTES[userRole], nextUrl));
  }

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isAuthPage && nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/(auth)/login', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};