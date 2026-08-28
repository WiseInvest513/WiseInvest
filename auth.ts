import NextAuth, { customFetch, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import authConfig from "@/auth.config";
import { createOAuthProxyFetch } from "@/lib/auth/oauth-proxy-fetch";
import { verifyPassword } from "@/lib/auth/password";
import { WisePrismaAdapter } from "@/lib/auth/wise-prisma-adapter";
import { findPasswordUser } from "@/lib/identity/users";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

const databaseConfigured = isDatabaseConfigured();
const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET;
const oauthProxyFetch = createOAuthProxyFetch(process.env.AUTH_OAUTH_PROXY_URL);

const providers: NextAuthConfig["providers"] = [
  ...(googleClientId && googleClientSecret
    ? [
        Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          allowDangerousEmailAccountLinking: false,
          ...(oauthProxyFetch ? { [customFetch]: oauthProxyFetch } : {}),
        }),
      ]
    : []),
  ...(githubClientId && githubClientSecret
    ? [
        GitHub({
          clientId: githubClientId,
          clientSecret: githubClientSecret,
          allowDangerousEmailAccountLinking: false,
          ...(oauthProxyFetch ? { [customFetch]: oauthProxyFetch } : {}),
        }),
      ]
    : []),
  Credentials({
    id: "password",
    name: "Email Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!databaseConfigured) return null;

      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      const user = await findPasswordUser(email);
      const verified = await verifyPassword(password, user?.passwordHash);
      if (!user || !verified) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        name: user.name,
        membershipTier: user.membershipTier,
        role: user.role,
        wiseUserId: user.wiseUserId,
      };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: databaseConfigured ? WisePrismaAdapter(getPrisma()) : undefined,
  providers,
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "wise-invest-local-auth-secret"),
  trustHost: true,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;

      if (userId && databaseConfigured) {
        const persistedUser = await getPrisma().user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            wiseUserId: true,
            membershipTier: true,
            role: true,
            email: true,
            name: true,
            image: true,
          },
        });

        if (persistedUser) {
          token.sub = persistedUser.id;
          token.wiseUserId = persistedUser.wiseUserId;
          token.membershipTier = persistedUser.membershipTier;
          token.role = persistedUser.role;
          token.email = persistedUser.email;
          token.name = persistedUser.name;
          token.picture = persistedUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
        session.user.wiseUserId = String(token.wiseUserId ?? "");
        session.user.membershipTier = String(token.membershipTier ?? "MEMBER");
        session.user.role = String(token.role ?? "USER");
      }

      return session;
    },
  },
});
