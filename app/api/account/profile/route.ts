import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeOptionalText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function normalizeAvatarUrl(value: unknown) {
  const text = normalizeOptionalText(value, 500);
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: false, message: "数据库暂未配置，无法保存个人资料。" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: unknown; image?: unknown };
    const name = normalizeOptionalText(body.name, 40);
    const rawImage = normalizeOptionalText(body.image, 500);
    const image = rawImage ? normalizeAvatarUrl(rawImage) : null;

    if (rawImage && !image) {
      return NextResponse.json({ ok: false, message: "头像地址需要是有效的 http 或 https 图片链接。" }, { status: 400 });
    }

    await getPrisma().user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
      },
    });

    return NextResponse.json({ ok: true, message: "个人资料已更新，刷新后会同步显示。" });
  } catch {
    return NextResponse.json({ ok: false, message: "个人资料保存失败，请稍后再试。" }, { status: 400 });
  }
}
