import type { NextAuthConfig } from "next-auth";
import { UserRole } from "../types/roles";

export const authConfig = {
  providers: [],
  // Strategy MUST be JWT for Proxy/Edge compatibility
  session: { strategy: "jwt" },
  pages: {
    signIn: "/(auth)/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.schoolId = token.schoolId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;