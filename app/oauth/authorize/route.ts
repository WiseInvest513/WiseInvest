import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { buildContentSecurityPolicy } from "@/lib/security/content-security-policy";
import { hashToken, randomToken } from "@/lib/sso/crypto";
import {
  createOauthErrorRedirect,
  normalizeScopes,
  validateRequestedScopes,
} from "@/lib/sso/oauth";
import { getRegisteredRedirectUri } from "@/lib/sso/redirect-uri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ValidAuthorizationRequest = {
  clientId: string;
  clientName: string;
  redirectUri: string;
  redirectOrigin: string;
  state: string | null;
  nonce: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  requestedScopes: string[];
};

const trustedWiseOrigins = new Set(["https://wise-invest.org", "https://www.wise-invest.org"]);

function secureAuthorizationResponse(response: NextResponse, redirectOrigin?: string) {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(redirectOrigin ? [redirectOrigin] : [])
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function jsonError(error: string, description: string, status = 400) {
  return secureAuthorizationResponse(
    NextResponse.json({ error, error_description: description }, { status })
  );
}

function getRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isTrustedPostOrigin(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);
  if (!requestOrigin) return false;
  if (trustedWiseOrigins.has(requestOrigin)) return true;

  if (process.env.NODE_ENV !== "production") {
    const localOrigins = new Set(["http://127.0.0.1:3002", "http://localhost:3002", request.nextUrl.origin]);
    return localOrigins.has(requestOrigin);
  }

  return false;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getParam(params: URLSearchParams, key: string) {
  return params.get(key) ?? "";
}

function renderConsentPage({
  clientName,
  params,
  redirectOrigin,
}: {
  clientName: string;
  params: URLSearchParams;
  redirectOrigin: string;
}) {
  const hiddenFields = [
    "response_type",
    "client_id",
    "redirect_uri",
    "scope",
    "state",
    "nonce",
    "code_challenge",
    "code_challenge_method",
  ]
    .map((key) => `<input type="hidden" name="${key}" value="${escapeHtml(getParam(params, key))}" />`)
    .join("\n");

  const scopes = normalizeScopes(params.get("scope"));
  const scopeLabels: Record<string, string> = {
    openid: "确认你的 Wise ID",
    profile: "读取头像和昵称",
    email: "读取邮箱地址",
    "wise.membership": "读取会员等级",
  };

  return secureAuthorizationResponse(new NextResponse(
    `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>授权 ${escapeHtml(clientName)} 使用 Wise ID</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #020617;
      background:
        radial-gradient(circle at 20% 16%, rgba(251, 191, 36, 0.2), transparent 32%),
        linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #fff7ed 100%);
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .card {
      width: min(100%, 520px);
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
      overflow: hidden;
    }
    .head { padding: 28px 28px 18px; border-bottom: 1px solid #e2e8f0; }
    .badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid #fde68a;
      border-radius: 999px;
      background: #fffbeb;
      color: #92400e;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 10px;
      margin-bottom: 14px;
    }
    h1 { margin: 0; font-size: 28px; line-height: 1.15; }
    p { margin: 12px 0 0; color: #64748b; line-height: 1.7; font-size: 14px; }
    .body { padding: 22px 28px 28px; }
    .scope {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 12px;
      margin-top: 10px;
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 14px;
    }
    .dot {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      background: #fbbf24;
      color: #020617;
      font-size: 12px;
      font-weight: 900;
      flex: 0 0 auto;
    }
    .actions { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; margin-top: 24px; }
    button {
      height: 48px;
      border-radius: 14px;
      font-weight: 900;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .approve {
      border: 0;
      background: #020617;
      color: #fbbf24;
    }
    .deny {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
    }
    .fine { margin-top: 18px; font-size: 12px; color: #94a3b8; }
    @media (max-width: 520px) {
      .actions { grid-template-columns: 1fr; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <main class="card">
    <section class="head">
      <div class="badge">Wise ID OAuth</div>
      <h1>授权 ${escapeHtml(clientName)} 使用你的 Wise ID</h1>
      <p>确认后会把你带回原网站。Wise 不会把你的登录密码、合作账户资料或后台权限提供给客户端。</p>
    </section>
    <section class="body">
      ${scopes.map((scope) => `<div class="scope"><span class="dot">✓</span>${escapeHtml(scopeLabels[scope] ?? scope)}</div>`).join("")}
      <form action="/oauth/authorize" method="post">
        ${hiddenFields}
        <div class="actions">
          <button class="deny" name="decision" type="submit" value="deny">取消</button>
          <button class="approve" name="decision" type="submit" value="approve">确认授权</button>
        </div>
      </form>
      <p class="fine">授权码有效期 10 分钟，客户端仍需要使用 PKCE 和 client_secret 在服务端换取 token。</p>
    </section>
  </main>
</body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  ), redirectOrigin);
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
  const registeredRedirect = getRegisteredRedirectUri(client, redirectUri);
  if (!registeredRedirect) {
    return { response: jsonError("invalid_request", "redirect_uri is not registered for this client.") };
  }

  const scopeError = validateRequestedScopes(requestedScopes, client.allowedScopes);
  if (scopeError) {
    return {
      response: secureAuthorizationResponse(
        NextResponse.redirect(createOauthErrorRedirect(redirectUri, "invalid_scope", scopeError, state), 303),
        registeredRedirect.origin
      ),
    };
  }

  if (client.requirePkce && (!codeChallenge || codeChallengeMethod !== "S256")) {
    return {
      response: secureAuthorizationResponse(
        NextResponse.redirect(
          createOauthErrorRedirect(redirectUri, "invalid_request", "PKCE S256 code challenge is required.", state),
          303
        ),
        registeredRedirect.origin
      ),
    };
  }

  return {
    value: {
      clientId,
      clientName: client.name,
      redirectUri,
      redirectOrigin: registeredRedirect.origin,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod,
      requestedScopes,
    } satisfies ValidAuthorizationRequest,
  };
}

function loginRedirect(request: NextRequest, params: URLSearchParams, redirectOrigin: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `/oauth/authorize?${params.toString()}`);
  return secureAuthorizationResponse(NextResponse.redirect(loginUrl, 303), redirectOrigin);
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
  return secureAuthorizationResponse(NextResponse.redirect(target, 303), input.redirectOrigin);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const validation = await validateAuthorizationRequest(params);
  if (validation.response) return validation.response;

  const session = await auth();
  if (!session?.user?.id) {
    return loginRedirect(request, params, validation.value.redirectOrigin);
  }

  return renderConsentPage({
    clientName: validation.value.clientName,
    params,
    redirectOrigin: validation.value.redirectOrigin,
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedPostOrigin(request)) {
    return jsonError("invalid_request", "Untrusted authorization form origin.", 403);
  }

  const params = new URLSearchParams(await request.text());
  const decision = params.get("decision");
  params.delete("decision");
  const validation = await validateAuthorizationRequest(params);
  if (validation.response) return validation.response;

  const session = await auth();
  if (!session?.user?.id) {
    return loginRedirect(request, params, validation.value.redirectOrigin);
  }

  if (decision === "deny") {
    return secureAuthorizationResponse(
      NextResponse.redirect(
        createOauthErrorRedirect(
          validation.value.redirectUri,
          "access_denied",
          "The user denied the authorization request.",
          validation.value.state
        ),
        303
      ),
      validation.value.redirectOrigin
    );
  }

  if (decision !== "approve") {
    return secureAuthorizationResponse(
      NextResponse.json(
        { error: "invalid_request", error_description: "Authorization decision is required." },
        { status: 400 }
      ),
      validation.value.redirectOrigin
    );
  }

  return issueAuthorizationCode(session.user.id, validation.value);
}
