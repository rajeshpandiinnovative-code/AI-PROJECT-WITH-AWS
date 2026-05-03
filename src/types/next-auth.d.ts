import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      schoolId?: string;
    } & Session["user"];
  }

  interface User {
    schoolId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    schoolId?: string;
  }
}

