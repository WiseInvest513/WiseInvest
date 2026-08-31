import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { createClientCredentials, WISE_SSO_SCOPES } from "@/lib/sso/oauth";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";

type SsoClientUpdatePayload = {
  name?: string;
  allowedRedirectUris?: string[] | string;
  allowedScopes?: string[];
  enabled?: boolean;
  requirePkce?: boolean;
  rotateSecret?: boolean;
};

function splitLines(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePayload(payload: SsoClientUpdatePayload) {
  const name = payload.name?.trim() ?? "";
  const allowedRedirectUris = splitLines(payload.allowedRedirectUris);
  const allowedScopes = (payload.allowedScopes?.length ? payload.allowedScopes : ["openid", "profile", "email", "wise.membership"])
    .filter((scope) => WISE_SSO_SCOPES.includes(scope as never));

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
  if (!allowedScopes.includes("openid")) throw new Error("Scope 必须包含 openid。");

  return {
    name,
    allowedRedirectUris,
    allowedScopes,
    enabled: Boolean(payload.enabled),
    requirePkce: payload.requirePkce !== false,
    rotateSecret: Boolean(payload.rotateSecret),
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const { id } = await context.params;
    const payload = (await request.json()) as SsoClientUpdatePayload;
    const data = parsePayload(payload);
    const rotated = data.rotateSecret ? createClientCredentials() : null;
    const prisma = getPrisma();

    const client = await prisma.ssoClient.update({
      where: { id },
      data: {
        name: data.name,
        allowedRedirectUris: data.allowedRedirectUris,
        allowedScopes: data.allowedScopes,
        enabled: data.enabled,
        requirePkce: data.requirePkce,
        ...(rotated ? { clientSecretHash: rotated.clientSecretHash } : {}),
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
        action: "SSO_CLIENT_UPDATED",
        metadata: {
          clientId: client.clientId,
          name: client.name,
          rotatedSecret: Boolean(rotated),
        },
      },
    });

    return NextResponse.json({ ok: true, client, clientSecret: rotated?.clientSecret ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update SSO client.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
