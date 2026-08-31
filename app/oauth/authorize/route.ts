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

type ValidAuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  state: string | null;
  nonce: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  requestedScopes: string[];
};

function jsonError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

async function validateAuthorizationRequest(params: URLSearchParams) {
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const responseType = params.get("response_type") ?? "";
  const state = params.get("state");
  const nonce = params.get("nonce");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method");
  const requestedScopes = normalizeScopes(params.get("scope"));

  if (responseType !== "code") {
    return { response: jsonError("unsupported_response_type", "Wise SSO only supports authorization code flow.") };
  }
  if (!clientId || !redirectUri) {
    return { response: jsonError("invalid_request", "client_id and redirect_uri are required.") };
  }

  const client = await getPrisma().ssoClient.findUnique({
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
    return { response: jsonError("unauthorized_client", "SSO client is not enabled.", 403) };
  }
  if (!isRedirectUriAllowed(client, redirectUri)) {
    return { response: jsonError("invalid_request", "redirect_uri is not registered for this client.") };
  }

  const scopeError = validateRequestedScopes(requestedScopes, client.allowedScopes);
  if (scopeError) {
    return {
      response: NextResponse.redirect(createOauthErrorRedirect(redirectUri, "invalid_scope", scopeError, state)),
    };
  }

  if (client.requirePkce && (!codeChallenge || codeChallengeMethod !== "S256")) {
    return {
      response: NextResponse.redirect(
        createOauthErrorRedirect(redirectUri, "invalid_request", "PKCE S256 code challenge is required.", state)
      ),
    };
  }

  return {
    value: {
      clientId,
      redirectUri,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod,
      requestedScopes,
    } satisfies ValidAuthorizationRequest,
  };
}

function loginRedirect(request: NextRequest, params: URLSearchParams) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `/oauth/authorize?${params.toString()}`);
  return NextResponse.redirect(loginUrl);
}

async function issueAuthorizationCode(userId: string, input: ValidAuthorizationRequest) {
  const code = randomToken(32);
  await getPrisma().ssoAuthorizationCode.create({
    data: {
      codeHash: hashToken(code),
      clientId: input.clientId,
      userId,
      redirectUri: input.redirectUri,
      scope: input.requestedScopes.join(" "),
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      nonce: input.nonce,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const target = new URL(input.redirectUri);
  target.searchParams.set("code", code);
  if (input.state) target.searchParams.set("state", input.state);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const params = request.nextUrl.searchParams;
  const validation = await validateAuthorizationRequest(params);
  if ("response" in validation) return validation.response;

  if (!session?.user?.id) return loginRedirect(request, params);

  const consentUrl = new URL("/oauth/consent", request.url);
  params.forEach((value, key) => consentUrl.searchParams.append(key, value));
  return NextResponse.redirect(consentUrl);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return jsonError("invalid_request", "Authorization confirmation origin is invalid.", 403);
  }

  const formData = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key !== "decision") params.append(key, value);
  }

  const validation = await validateAuthorizationRequest(params);
  if ("response" in validation) return validation.response;
  const input = validation.value;
  const session = await auth();
  if (!session?.user?.id) return loginRedirect(request, params);

  if (formData.get("decision") !== "approve") {
    return NextResponse.redirect(
      createOauthErrorRedirect(input.redirectUri, "access_denied", "The user denied the authorization request.", input.state)
    );
  }

  return issueAuthorizationCode(session.user.id, input);
}
