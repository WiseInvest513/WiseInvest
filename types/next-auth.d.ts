import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      wiseUserId: string;
      membershipTier: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    wiseUserId?: string;
    membershipTier?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wiseUserId?: string;
    membershipTier?: string;
    role?: string;
  }
}
