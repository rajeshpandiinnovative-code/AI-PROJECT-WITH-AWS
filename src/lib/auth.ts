import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { authConfig } from "./auth.config";
import { UserRole } from "../types/roles";
import { founderEmail } from "./rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // POINT TO DIRECT FILES TO HELP WEBPACK
        const { db } = await import("../db/index"); 
        const { users } = await import("../db/schema");

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: email === founderEmail() ? UserRole.SUPER_ADMIN : (user.role as UserRole),
          schoolId: user.schoolId,
        };
      },
    }),
  ],
});