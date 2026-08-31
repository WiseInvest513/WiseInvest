import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/sso/crypto";
import {
  createOauthErrorRedirect,
  isRedirectUriAllowed,
  normalizeScopes,
  validateRequestedScopes,
} from "@/lib/sso/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const params = request.nextUrl.searchParams;
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const responseType = params.get("response_type") ?? "";
  const state = params.get("state");
  const nonce = params.get("nonce");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method");
  const requestedScopes = normalizeScopes(params.get("scope"));

  if (responseType !== "code") {
    return jsonError("unsupported_response_type", "Wise SSO only supports authorization code flow.");
  }
  if (!clientId || !redirectUri) {
    return jsonError("invalid_request", "client_id and redirect_uri are required.");
  }

  const prisma = getPrisma();
  const client = await prisma.ssoClient.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      name: true,
      allowedRedirectUris: true,
      allowedScopes: true,
      requirePkce: true,
      enabled: true,
    },
  });

  if (!client || !client.enabled) {
    return jsonError("unauthorized_client", "SSO client is not enabled.", 403);
  }
  if (!isRedirectUriAllowed(client, redirectUri)) {
    return jsonError("invalid_request", "redirect_uri is not registered for this client.");
  }

  const scopeError = validateRequestedScopes(requestedScopes, client.allowedScopes);
  if (scopeError) {
    return NextResponse.redirect(createOauthErrorRedirect(redirectUri, "invalid_scope", scopeError, state));
  }

  if (client.requirePkce && (!codeChallenge || codeChallengeMethod !== "S256")) {
    return NextResponse.redirect(
      createOauthErrorRedirect(redirectUri, "invalid_request", "PKCE S256 code challenge is required.", state)
    );
  }

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const code = randomToken(32);
  const scope = requestedScopes.join(" ");
  await prisma.ssoAuthorizationCode.create({
    data: {
      codeHash: hashToken(code),
      clientId: client.clientId,
      userId: session.user.id,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
      nonce,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return NextResponse.redirect(target);
}
