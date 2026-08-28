import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { updateUserPassword } from "@/lib/identity/users";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: false, message: "数据库暂未配置，无法修改密码。" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!validatePasswordStrength(newPassword)) {
      return NextResponse.json({ ok: false, message: "新密码需大于 8 位，并包含大小写字母和数字。" }, { status: 400 });
    }

    const user = await getPrisma().user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json({ ok: false, message: "当前账户没有可用于密码登录的邮箱。" }, { status: 400 });
    }

    if (user.passwordHash) {
      const verified = await verifyPassword(currentPassword, user.passwordHash);
      if (!verified) {
        return NextResponse.json({ ok: false, message: "当前密码不正确。" }, { status: 400 });
      }
    }

    await updateUserPassword(user.id, user.email, newPassword);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "密码修改失败，请稍后再试。" }, { status: 400 });
  }
}
