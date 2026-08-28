import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtectedPath = request.nextUrl.pathname.startsWith("/account");

      if (isProtectedPath) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
