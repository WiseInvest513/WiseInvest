import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { createClientCredentials, WISE_SSO_SCOPES } from "@/lib/sso/oauth";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";

type SsoClientPayload = {
  clientId?: string;
  name?: string;
  allowedRedirectUris?: string[] | string;
  allowedScopes?: string[];
  enabled?: boolean;
  requirePkce?: boolean;
};

function splitLines(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePayload(payload: SsoClientPayload) {
  const generated = createClientCredentials();
  const clientId = (payload.clientId?.trim() || generated.clientId).replace(/\s+/g, "_");
  const name = payload.name?.trim() ?? "";
  const allowedRedirectUris = splitLines(payload.allowedRedirectUris);
  const allowedScopes = (payload.allowedScopes?.length ? payload.allowedScopes : ["openid", "profile", "email", "wise.membership"])
    .filter((scope) => WISE_SSO_SCOPES.includes(scope as never));

  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(clientId)) {
    throw new Error("clientId 只能包含字母、数字、下划线和短横线，长度 8-80。");
  }
  if (!name) throw new Error("客户端名称不能为空。");
  if (!allowedRedirectUris.length) throw new Error("至少需要一个回调地址。");

  for (const uri of allowedRedirectUris) {
    const url = new URL(uri);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("回调地址必须是 http 或 https。");
    if (url.hash) throw new Error("回调地址不能包含 hash。");
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      throw new Error("生产回调地址必须使用 https。");
    }
  }

  if (!allowedScopes.includes("openid")) {
    throw new Error("Scope 必须包含 openid。");
  }

  return {
    data: {
      clientId,
      clientSecretHash: generated.clientSecretHash,
      name,
      allowedRedirectUris,
      allowedScopes,
      enabled: Boolean(payload.enabled),
      requirePkce: payload.requirePkce !== false,
    },
    clientSecret: generated.clientSecret,
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const isDevAdmin = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || session.user.role !== "ADMIN") && !isDevAdmin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "DATABASE_URL is required." }, { status: 503 });
  }

  const adminUserId = session?.user?.id ?? "dev_admin_user";
  const limitedResponse = await checkAdminMutationLimit(request, adminUserId);
  if (limitedResponse) return limitedResponse;

  try {
    const payload = (await request.json()) as SsoClientPayload;
    const { data, clientSecret } = parsePayload(payload);
    const prisma = getPrisma();

    const client = await prisma.ssoClient.create({
      data: {
        ...data,
        createdById: adminUserId,
        updatedById: adminUserId,
      },
      select: {
        id: true,
        clientId: true,
        name: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "SSO_CLIENT_CREATED",
        metadata: {
          clientId: client.clientId,
          name: client.name,
        },
      },
    });

    return NextResponse.json({ ok: true, client, clientSecret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create SSO client.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
