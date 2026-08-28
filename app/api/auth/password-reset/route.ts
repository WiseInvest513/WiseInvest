import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/auth/password";
import { normalizeEmail, verifyEmailOtp } from "@/lib/email/otp";
import { updateUserPassword } from "@/lib/identity/users";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: false, message: "数据库暂未配置，无法重设密码。" }, { status: 503 });
    }

    const body = (await request.json()) as {
      email?: string;
      code?: string;
      password?: string;
    };
    const email = normalizeEmail(body.email ?? "");
    const code = String(body.code ?? "").trim();
    const password = String(body.password ?? "");

    if (!validatePasswordStrength(password)) {
      return NextResponse.json({ ok: false, message: "新密码需大于 8 位，并包含大小写字母和数字。" }, { status: 400 });
    }

    const verified = await verifyEmailOtp(email, code);
    if (!verified) {
      return NextResponse.json({ ok: false, message: "验证码不正确或已过期。" }, { status: 400 });
    }

    const user = await getPrisma().user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json({ ok: false, message: "这个邮箱还没有注册 Wise ID，请先注册。" }, { status: 404 });
    }

    await updateUserPassword(user.id, user.email, password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "密码重设失败，请稍后再试。" }, { status: 400 });
  }
}
