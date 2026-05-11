import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { platformUsers, schools } from "@/src/db/schema";
import { recordAnalyticsEvent } from "@/src/lib/analytics";
import { founderEmail } from "@/src/lib/rbac";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  /** Required for Auth.js on localhost / some hosts when `AUTH_URL` is unset. */
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        schoolId: { label: "School ID", type: "text" },
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const phoneNumberRaw = typeof credentials?.phoneNumber === "string" ? credentials.phoneNumber : "";
          const otp = typeof credentials?.otp === "string" ? credentials.otp.trim() : "";
          const phoneNumber = phoneNumberRaw.replace(/[^\d]/g, "").slice(-10);
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";

          if (phoneNumber && otp) {
            const [user] = await db
              .select()
              .from(platformUsers)
              .where(eq(platformUsers.phoneNumber, phoneNumber))
              .limit(1);
            if (!user || !user.otpSecret || !user.otpExpires) {
              return null;
            }
            if (user.otpExpires.getTime() < Date.now()) {
              return null;
            }
            const otpOk = await bcrypt.compare(otp, user.otpSecret);
            if (!otpOk) {
              return null;
            }

            await db
              .update(platformUsers)
              .set({
                isVerified: true,
                otpSecret: null,
                otpExpires: null,
                updatedAt: new Date(),
              })
              .where(eq(platformUsers.id, user.id));

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
        } catch (err) {
          console.error("[auth] Credentials authorize failed (check DATABASE_URL and DB reachability):", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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

      /** Keep role / school / board in sync with `platform_users` (e.g. after `set-platform-role` script). */
      if (token.authSubject === "platform_user") {
        const platformId =
          typeof token.platformUserId === "string" && token.platformUserId
            ? token.platformUserId
            : typeof token.sub === "string"
              ? token.sub
              : undefined;
        if (platformId) {
          const [row] = await db
            .select({
              role: platformUsers.role,
              schoolId: platformUsers.schoolId,
              board: platformUsers.board,
              email: platformUsers.email,
            })
            .from(platformUsers)
            .where(eq(platformUsers.id, platformId))
            .limit(1);
          if (row) {
            const email = row.email.trim().toLowerCase();
            const founder = founderEmail();
            const persistedRole = row.role;
            token.role =
              persistedRole === "master_admin" && email !== founder
                ? "admin"
                : persistedRole;
            token.schoolId = row.schoolId ?? undefined;
            token.board = row.board?.trim() || undefined;
            token.email = row.email;
          }
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
