import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeWechatId(value: unknown) {
  const wechatId = String(value ?? "").trim();
  if (!wechatId) return null;
  if (wechatId.length > 64 || /[\u0000-\u001f\u007f]/.test(wechatId)) return undefined;
  return wechatId;
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: false, message: "数据库暂未配置，无法保存微信号。" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
    }

    const user = await getPrisma().user.findUnique({
      where: { id: session.user.id },
      select: { membershipTier: true, role: true },
    });
    const canSave = user?.role === "ADMIN" || user?.membershipTier === "VIP" || user?.membershipTier === "VIP_PLUS";
    if (!canSave) {
      return NextResponse.json({ ok: false, message: "该资料仅向 Wise VIP 和 SVIP 用户开放。" }, { status: 403 });
    }

    const body = (await request.json()) as { wechatId?: unknown };
    const wechatId = normalizeWechatId(body.wechatId);
    if (wechatId === undefined) {
      return NextResponse.json({ ok: false, message: "请输入不超过 64 个字符的有效微信号。" }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { wechatId },
      }),
      prisma.vipExchangeRecord.updateMany({
        where: { userId: session.user.id },
        data: { wechatId },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: wechatId ? "微信号已保存。" : "微信号已清除。",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "微信号保存失败，请稍后再试。" }, { status: 400 });
  }
}
