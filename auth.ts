import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { platformUsers, schools } from "@/src/db/schema";
import { recordAnalyticsEvent } from "@/src/lib/analytics";
import type { DevSessionUpdate } from "@/src/lib/dev-session";
import { passwordHashSupportsBcryptVerify } from "@/src/lib/password-hash-utils";
import { founderEmail } from "@/src/lib/rbac";
import { z } from "zod";

/** Case-insensitive match on `platform_users.email` (Google + login normalize to lower). */
async function loadPlatformUserRowByNormalizedEmail(emailLowerTrimmed: string) {
  const [row] = await db
    .select()
    .from(platformUsers)
    .where(sql`lower(trim(${platformUsers.email})) = ${emailLowerTrimmed}`)
    .limit(1);
  return row;
}

/**
 * JWT `role` from `platform_users`: founder email always SUPER_ADMIN; any other SUPER_ADMIN row is
 * downgraded to SCHOOL_ADMIN so only the configured founder is global admin.
 */
function jwtRoleForPlatformUser(emailFromRow: string, persistedRole: string): string {
  const e = emailFromRow.trim().toLowerCase();
  if (e === founderEmail()) return "SUPER_ADMIN";
  if (persistedRole === "SUPER_ADMIN") return "SCHOOL_ADMIN";
  return persistedRole;
}

function googleAuthProviders() {
  const id =
    process.env.AUTH_GOOGLE_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  const secret =
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) return [];
  return [
    Google({
      clientId: id,
      clientSecret: secret,
      allowDangerousEmailAccountLinking: true,
    }),
  ];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  /** Required for Auth.js on localhost / some hosts when `AUTH_URL` is unset. */
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...googleAuthProviders(),
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

          /** Email/password must run before OTP: some clients send empty strings for unused fields; OTP branch could win incorrectly. */
          if (email && password) {
            const user = await loadPlatformUserRowByNormalizedEmail(email);

            if (!user) {
              if (process.env.NODE_ENV === "development") {
                console.warn("[auth] Email sign-in: no platform_users row for email:", email);
              }
              return null;
            }

            if (!passwordHashSupportsBcryptVerify(user.passwordHash)) {
              if (process.env.NODE_ENV === "development") {
                console.warn("[auth] Email sign-in: password login not configured for row (use Google):", email);
              }
              return null;
            }

            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) {
              if (process.env.NODE_ENV === "development") {
                console.warn("[auth] Email sign-in: password mismatch for:", email);
              }
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.displayName || user.email,
              platformUserId: user.id,
              role: jwtRoleForPlatformUser(user.email, user.role),
              schoolId: user.schoolId ?? undefined,
              board: user.board?.trim() || undefined,
              linkedStudentId: user.linkedStudentId ?? undefined,
              authSubject: "platform_user" as const,
            };
          }

          if (phoneNumber.length === 10 && otp) {
            const isDev = process.env.NODE_ENV === "development";
            const masterOtp = (process.env.DEV_MASTER_OTP ?? "123456").trim();
            const masterOtpOk = isDev && otp === masterOtp;

            let user =
              (
                await db
                  .select()
                  .from(platformUsers)
                  .where(eq(platformUsers.phoneNumber, phoneNumber))
                  .limit(1)
              )[0] ?? undefined;

            /** Local QA: no row by phone (unseeded DB) — optional fallback user by email. */
            if (!user && masterOtpOk) {
              const fallbackEmail = process.env.DEV_MASTER_SIGNIN_EMAIL?.trim().toLowerCase();
              if (fallbackEmail) {
                user = (await loadPlatformUserRowByNormalizedEmail(fallbackEmail)) ?? undefined;
              }
            }

            if (!user) {
              return null;
            }

            if (!masterOtpOk) {
              if (!user.otpSecret || !user.otpExpires) {
                return null;
              }
              if (user.otpExpires.getTime() < Date.now()) {
                return null;
              }
              const otpOk = await bcrypt.compare(otp, user.otpSecret);
              if (!otpOk) {
                return null;
              }
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
              role: jwtRoleForPlatformUser(user.email, user.role),
              schoolId: user.schoolId ?? undefined,
              board: user.board?.trim() || undefined,
              linkedStudentId: user.linkedStudentId ?? undefined,
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
          const msg = err instanceof Error ? err.message : "unknown error";
          console.error("[auth] Credentials authorize failed:", msg);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
        if (!email) return false;
        const row = await loadPlatformUserRowByNormalizedEmail(email);
        if (!row) {
          return "/login?error=no_platform_account";
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        if (account?.provider === "google") {
          const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
          const row = email ? await loadPlatformUserRowByNormalizedEmail(email) : undefined;
          if (row) {
            token.authSubject = "platform_user";
            token.platformUserId = row.id;
            token.sub = row.id;
            token.email = row.email;
            token.role = jwtRoleForPlatformUser(row.email, row.role);
            token.schoolId = row.schoolId ?? undefined;
            token.board = row.board?.trim() || undefined;
            token.linkedStudentId = row.linkedStudentId ?? undefined;
            token.name = row.displayName?.trim() || row.email;
          }
        }

        const u = user as import("next-auth").User & { id?: string };
        const isPlatformUser =
          u.authSubject === "platform_user" ||
          (typeof u.platformUserId === "string" && u.platformUserId.length > 0);

        if (account?.provider !== "google" && isPlatformUser) {
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
          token.linkedStudentId =
            typeof u.linkedStudentId === "string" && u.linkedStudentId ? u.linkedStudentId : undefined;
        } else if (account?.provider !== "google" && (u.authSubject === "school" || (typeof u.schoolId === "string" && u.schoolId))) {
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
              linkedStudentId: platformUsers.linkedStudentId,
              displayName: platformUsers.displayName,
            })
            .from(platformUsers)
            .where(eq(platformUsers.id, platformId))
            .limit(1);
          if (row) {
            token.role = jwtRoleForPlatformUser(row.email, row.role);
            token.schoolId = row.schoolId ?? undefined;
            token.board = row.board?.trim() || undefined;
            token.email = row.email;
            token.linkedStudentId = row.linkedStudentId ?? undefined;
            token.name = row.displayName?.trim() || row.email;
          }
        }
      }

      /** Local QA: override JWT tenant + role after DB sync (session.update from DevSwitcher). */
      if (process.env.NODE_ENV === "development") {
        if (trigger === "update" && session && typeof session === "object") {
          const s = session as DevSessionUpdate;
          if (s.clearDevSessionOverrides === true) {
            delete token.devRoleOverride;
            delete token.devSchoolIdOverride;
            delete token.devLinkedStudentIdOverride;
          } else {
            if (typeof s.devRoleOverride === "string" && s.devRoleOverride.trim()) {
              token.devRoleOverride = s.devRoleOverride.trim();
            }
            if (typeof s.devSchoolIdOverride === "string" && s.devSchoolIdOverride.trim()) {
              token.devSchoolIdOverride = s.devSchoolIdOverride.trim();
            }
            if ("devLinkedStudentIdOverride" in s) {
              const v = s.devLinkedStudentIdOverride;
              if (v === null || v === undefined || v === "") {
                delete token.devLinkedStudentIdOverride;
              } else if (typeof v === "string") {
                token.devLinkedStudentIdOverride = v.trim();
              }
            }
          }
        }

        if (typeof token.devRoleOverride === "string" && token.devRoleOverride.length > 0) {
          token.role = token.devRoleOverride;
        }
        if (typeof token.devSchoolIdOverride === "string" && token.devSchoolIdOverride.length > 0) {
          token.schoolId = token.devSchoolIdOverride;
        }
        if (typeof token.devLinkedStudentIdOverride === "string" && token.devLinkedStudentIdOverride.length > 0) {
          token.linkedStudentId = token.devLinkedStudentIdOverride;
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
        if (typeof token.name === "string" && token.name.length > 0) {
          session.user.name = token.name;
        }
        session.user.board = typeof token.board === "string" ? token.board : undefined;
        session.user.linkedStudentId =
          typeof token.linkedStudentId === "string" ? token.linkedStudentId : undefined;
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
