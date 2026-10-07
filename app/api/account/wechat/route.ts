import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

const officialWechatIds = new Set(["wiseinvest520"]);

function normalizeWechatId(value: unknown) {
  const wechatId = String(value ?? "").trim();
  if (!wechatId) return null;
  if (wechatId.length > 64 || /[\u0000-\u001f\u007f]/.test(wechatId)) return undefined;
  const normalized = wechatId.toLowerCase();
  if (officialWechatIds.has(normalized) || normalized.startsWith("wxid_")) return undefined;
  return wechatId;
}

function normalizeWechatCity(value: unknown) {
  const city = String(value ?? "").trim();
  if (!city) return null;
  if (city.length > 32 || /[\u0000-\u001f\u007f]/.test(city)) return undefined;
  return city;
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

    const body = (await request.json()) as { wechatId?: unknown; wechatCity?: unknown };
    const wechatId = normalizeWechatId(body.wechatId);
    const wechatCity = normalizeWechatCity(body.wechatCity);
    if (wechatId === undefined) {
      return NextResponse.json({ ok: false, message: "请填写自己的个人微信号，不要填写 WiseInvest520 或 wxid_ 开头的原始微信号。" }, { status: 400 });
    }
    if (wechatCity === undefined) {
      return NextResponse.json({ ok: false, message: "请输入不超过 32 个字符的有效城市。" }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { wechatId, wechatCity },
      }),
      prisma.vipExchangeRecord.updateMany({
        where: { userId: session.user.id },
        data: { wechatId, wechatCity },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: wechatId || wechatCity ? "VIP 联系信息已保存。" : "VIP 联系信息已清除。",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "微信号保存失败，请稍后再试。" }, { status: 400 });
  }
}
