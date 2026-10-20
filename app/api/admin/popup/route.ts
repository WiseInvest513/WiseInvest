import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { parsePopupCampaign } from "@/lib/popup-campaign";
import { savePopupCampaign } from "@/lib/popup-campaign-store";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    sameOrigin = origin.host === request.headers.get("host") &&
      (origin.protocol === "https:" || (process.env.NODE_ENV !== "production" && origin.protocol === "http:"));
  } catch { /* A missing or malformed Origin is never trusted. */ }
  if (!sameOrigin) {
    return NextResponse.json({ message: "请求来源无效" }, { status: 403 });
  }
  const session = await auth();
  const preview = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || session.user.role !== "ADMIN") && !preview) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const actor = session?.user?.id ?? "dev_admin_user";
  if (process.env.NODE_ENV === "production") {
    const limited = await checkAdminMutationLimit(request, actor);
    if (limited) return limited;
  }
  let config;
  let revision;
  try {
    const body = await request.json();
    config = parsePopupCampaign(body.config);
    revision = body.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error("配置版本无效");
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "配置无效" }, { status: 400 });
  }
  try {
    const result = await savePopupCampaign(config, revision, actor);
    return NextResponse.json({ ok: true, ...result, preview: process.env.NODE_ENV !== "production" });
  } catch (error) {
    const conflict = error instanceof Error && error.message.includes("配置已被更新");
    return NextResponse.json({ message: conflict ? error.message : "保存失败，请检查数据库迁移与连接后重试。" }, { status: conflict ? 409 : 503 });
  }
}
