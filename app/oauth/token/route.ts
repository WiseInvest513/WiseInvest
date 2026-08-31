import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { hashToken, verifyPkceChallenge } from "@/lib/sso/crypto";
import { createTokenPair, verifyClientSecret } from "@/lib/sso/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readParams(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return new URLSearchParams(
      Object.entries(body).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))
    );
  }

  return new URLSearchParams(await request.text());
}

function readBasicAuth(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return {};

  try {
    const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator === -1) return {};
    return {
      clientId: decoded.slice(0, separator),
      clientSecret: decoded.slice(separator + 1),
    };
  } catch {
    return {};
  }
}

function tokenError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

export async function POST(request: NextRequest) {
  const params = await readParams(request);
  const basicAuth = readBasicAuth(request);
  const grantType = params.get("grant_type");
  const code = params.get("code");
  const redirectUri = params.get("redirect_uri");
  const clientId = basicAuth.clientId ?? params.get("client_id");
  const clientSecret = basicAuth.clientSecret ?? params.get("client_secret");
  const codeVerifier = params.get("code_verifier");

  if (grantType !== "authorization_code") {
    return tokenError("unsupported_grant_type", "Wise SSO only supports authorization_code.");
  }
  if (!code || !redirectUri || !clientId) {
    return tokenError("invalid_request", "code, redirect_uri and client_id are required.");
  }

  const prisma = getPrisma();
  const client = await prisma.ssoClient.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      clientSecretHash: true,
      enabled: true,
      requirePkce: true,
    },
  });

  if (!client || !client.enabled) {
    return tokenError("invalid_client", "SSO client is not enabled.", 401);
  }
  if (!verifyClientSecret(client, clientSecret)) {
    return tokenError("invalid_client", "Invalid client credentials.", 401);
  }

  const authorizationCode = await prisma.ssoAuthorizationCode.findUnique({
    where: { codeHash: hashToken(code) },
    include: {
      user: {
        select: {
          id: true,
          wiseUserId: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          membershipTier: true,
        },
      },
    },
  });

  if (
    !authorizationCode
    || authorizationCode.clientId !== client.clientId
    || authorizationCode.redirectUri !== redirectUri
    || authorizationCode.consumedAt
    || authorizationCode.expiresAt.getTime() <= Date.now()
  ) {
    return tokenError("invalid_grant", "Authorization code is invalid or expired.", 400);
  }

  if (client.requirePkce) {
    if (
      !codeVerifier
      || !authorizationCode.codeChallenge
      || !verifyPkceChallenge(codeVerifier, authorizationCode.codeChallenge, authorizationCode.codeChallengeMethod)
    ) {
      return tokenError("invalid_grant", "PKCE verification failed.", 400);
    }
  }

  const consumed = await prisma.ssoAuthorizationCode.updateMany({
    where: {
      id: authorizationCode.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  if (consumed.count !== 1) {
    return tokenError("invalid_grant", "Authorization code has already been used.", 400);
  }

  return NextResponse.json(
    createTokenPair({
      clientId: client.clientId,
      nonce: authorizationCode.nonce,
      scope: authorizationCode.scope,
      user: authorizationCode.user,
    }),
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    }
  );
}
