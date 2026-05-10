import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { platformUsers, schools } from "@/src/db/schema";
import { recordAnalyticsEvent } from "@/src/lib/analytics";
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (email && password) {
          const [user] = await db
            .select()
            .from(platformUsers)
            .where(eq(platformUsers.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.email,
            platformUserId: user.id,
            role: user.role,
            schoolId: user.schoolId ?? undefined,
            board: user.board?.trim() || undefined,
            authSubject: "platform_user" as const,
          };
        }

        const schoolId = credentials?.schoolId;
        if (!schoolId || typeof schoolId !== "string") {
          return null;
        }

        const trimmed = schoolId.trim();
        if (!z.string().uuid().safeParse(trimmed).success) {
          return null;
        }

        const [row] = await db
          .select({ id: schools.id, board: schools.board })
          .from(schools)
          .where(eq(schools.id, trimmed))
          .limit(1);

        if (!row) {
          return null;
        }

        return {
          id: row.id,
          schoolId: row.id,
          board: row.board?.trim() || undefined,
          authSubject: "school" as const,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as import("next-auth").User & { id?: string };
        const isPlatformUser =
          u.authSubject === "platform_user" ||
          (typeof u.platformUserId === "string" && u.platformUserId.length > 0);

        if (isPlatformUser) {
          token.authSubject = "platform_user";
          token.platformUserId =
            typeof u.platformUserId === "string" && u.platformUserId
              ? u.platformUserId
              : typeof u.id === "string"
                ? u.id
                : undefined;
          token.role = typeof u.role === "string" ? u.role : undefined;
          token.schoolId = typeof u.schoolId === "string" ? u.schoolId : undefined;
          token.board = typeof u.board === "string" ? u.board : undefined;
          token.email = typeof u.email === "string" ? u.email : undefined;
        } else if (u.authSubject === "school" || (typeof u.schoolId === "string" && u.schoolId)) {
          token.authSubject = "school";
          token.schoolId = typeof u.schoolId === "string" ? u.schoolId : undefined;
          token.board = typeof u.board === "string" ? u.board : undefined;
          token.platformUserId = undefined;
          token.role = undefined;
          token.email = undefined;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.schoolId = typeof token.schoolId === "string" ? token.schoolId : undefined;
        const tokenPid = typeof token.platformUserId === "string" ? token.platformUserId : undefined;
        session.user.platformUserId =
          tokenPid ??
          (token.authSubject === "platform_user" && typeof token.sub === "string" ? token.sub : undefined);
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.authSubject =
          token.authSubject === "platform_user" || token.authSubject === "school" ? token.authSubject : undefined;
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        session.user.board = typeof token.board === "string" ? token.board : undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const u = user as Record<string, unknown>;
      await recordAnalyticsEvent({
        eventType: "login_success",
        payload: {
          userId: u.id,
          email: typeof u.email === "string" ? u.email : undefined,
          schoolId: typeof u.schoolId === "string" ? u.schoolId : undefined,
          platformUserId: typeof u.platformUserId === "string" ? u.platformUserId : undefined,
          role: typeof u.role === "string" ? u.role : undefined,
          board: typeof u.board === "string" ? u.board : undefined,
          authSubject: typeof u.authSubject === "string" ? u.authSubject : undefined,
        },
      });
    },
  },
});
