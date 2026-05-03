import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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

        return {
          id: schoolId,
          schoolId,
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

