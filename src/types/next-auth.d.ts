import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      /** Credentials user id (same as platform user id for email accounts). */
      id?: string;
      schoolId?: string;
      platformUserId?: string;
      role?: string;
      /** Curriculum board (tenant board for school login; chosen board for platform users). */
      board?: string;
      authSubject?: "school" | "platform_user";
    } & Session["user"];
  }

  interface User {
    id?: string;
    schoolId?: string;
    platformUserId?: string;
    role?: string;
    board?: string;
    authSubject?: "school" | "platform_user";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    schoolId?: string;
    platformUserId?: string;
    role?: string;
    board?: string;
    authSubject?: "school" | "platform_user";
  }
}

