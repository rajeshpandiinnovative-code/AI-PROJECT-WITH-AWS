import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { schools } from "@/src/db/schema";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        schoolId: { label: "School ID", type: "text" },
      },
      async authorize(credentials) {
        const schoolId = credentials?.schoolId;
        if (!schoolId || typeof schoolId !== "string") {
          return null;
        }

        const trimmed = schoolId.trim();
        if (!z.string().uuid().safeParse(trimmed).success) {
          return null;
        }

        const [row] = await db
          .select({ id: schools.id })
          .from(schools)
          .where(eq(schools.id, trimmed))
          .limit(1);

        if (!row) {
          return null;
        }

        return {
          id: row.id,
          schoolId: row.id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && "schoolId" in user) {
        token.schoolId = user.schoolId as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.schoolId = typeof token.schoolId === "string" ? token.schoolId : undefined;
      }
      return session;
    },
  },
});

