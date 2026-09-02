import type { SsoClient, User } from "@prisma/client";
import { getSsoIssuer, hashToken, randomToken, signJwt, verifyHashedToken } from "@/lib/sso/crypto";
export { isRedirectUriAllowed } from "@/lib/sso/redirect-uri";

export const WISE_SSO_SCOPES = ["openid", "profile", "email", "wise.membership"] as const;

export type WiseSsoScope = (typeof WISE_SSO_SCOPES)[number];

export function normalizeScopes(scope: string | null | undefined) {
  const requested = (scope ?? "openid profile email")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(requested));
}

export function validateRequestedScopes(requestedScopes: string[], allowedScopes: string[]) {
  if (!requestedScopes.includes("openid")) {
    return "scope must include openid";
  }

  const allowed = new Set(allowedScopes.length ? allowedScopes : WISE_SSO_SCOPES);
  const invalid = requestedScopes.find((scope) => !allowed.has(scope));
  return invalid ? `scope ${invalid} is not allowed for this client` : null;
}

export function createClientCredentials() {
  const clientId = `wise_${randomToken(12)}`;
  const clientSecret = `wsec_${randomToken(32)}`;
  return {
    clientId,
    clientSecret,
    clientSecretHash: hashToken(clientSecret),
  };
}

export function verifyClientSecret(client: Pick<SsoClient, "clientSecretHash">, secret: string | null | undefined) {
  if (!client.clientSecretHash) return true;
  if (!secret) return false;
  return verifyHashedToken(secret, client.clientSecretHash);
}

export function createOauthErrorRedirect(redirectUri: string, error: string, description?: string, state?: string | null) {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  if (description) target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  return target;
}

export function createTokenPair({
  clientId,
  nonce,
  scope,
  user,
}: {
  clientId: string;
  nonce?: string | null;
  scope: string;
  user: Pick<User, "id" | "wiseUserId" | "email" | "emailVerified" | "name" | "image" | "membershipTier">;
}) {
  const issuer = getSsoIssuer();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 60 * 60;
  const scopes = normalizeScopes(scope);
  const sub = user.wiseUserId;

  const commonProfile = {
    wise_user_id: user.wiseUserId,
    user_id: user.id,
  };

  const profileClaims = scopes.includes("profile")
    ? {
        name: user.name,
        picture: user.image,
      }
    : {};

  const emailClaims = scopes.includes("email")
    ? {
        email: user.email,
        email_verified: Boolean(user.emailVerified),
      }
    : {};

  const membershipClaims = scopes.includes("wise.membership")
    ? {
        membership_tier: user.membershipTier,
      }
    : {};

  const idToken = signJwt({
    iss: issuer,
    sub,
    aud: clientId,
    iat: now,
    exp: now + expiresIn,
    token_use: "id_token",
    ...(nonce ? { nonce } : {}),
    ...commonProfile,
    ...profileClaims,
    ...emailClaims,
    ...membershipClaims,
  });

  const accessToken = signJwt({
    iss: issuer,
    sub,
    aud: `${issuer}/oauth/userinfo`,
    client_id: clientId,
    iat: now,
    exp: now + expiresIn,
    token_use: "access_token",
    scope,
    ...commonProfile,
  });

  return {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope,
  };
}

export function buildUserinfo(user: Pick<User, "id" | "wiseUserId" | "email" | "emailVerified" | "name" | "image" | "membershipTier">, scope: string) {
  const scopes = normalizeScopes(scope);
  return {
    sub: user.wiseUserId,
    wise_user_id: user.wiseUserId,
    user_id: user.id,
    ...(scopes.includes("profile")
      ? {
          name: user.name,
          picture: user.image,
        }
      : {}),
    ...(scopes.includes("email")
      ? {
          email: user.email,
          email_verified: Boolean(user.emailVerified),
        }
      : {}),
    ...(scopes.includes("wise.membership")
      ? {
          membership_tier: user.membershipTier,
        }
      : {}),
  };
}
