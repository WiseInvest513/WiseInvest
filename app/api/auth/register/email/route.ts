import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/auth/password";
import { normalizeEmail, verifyEmailOtp } from "@/lib/email/otp";
import { registerEmailPasswordUser } from "@/lib/identity/users";
import { isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: false, message: "DATABASE_URL is not configured." }, { status: 503 });
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
      return NextResponse.json({ ok: false, message: "密码需大于 8 位，并包含大小写字母和数字。" }, { status: 400 });
    }

    const verified = await verifyEmailOtp(email, code);
    if (!verified) {
      return NextResponse.json({ ok: false, message: "验证码不正确或已过期。" }, { status: 400 });
    }

    await registerEmailPasswordUser(email, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败，请稍后再试。";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
