import { NextResponse } from "next/server";
import { requestEmailOtp } from "@/lib/email/otp";

export const runtime = "nodejs";

function getClientErrorMessage(message: string) {
  if (message.includes("Invalid email")) return "请输入有效邮箱地址。";
  if (message.includes("Too many")) return "验证码请求过于频繁，请稍后再试。";
  if (message.includes("DATABASE_URL")) return "数据库暂未配置，无法创建 Wise ID。";
  if (message.includes("RESEND_API_KEY")) return "邮件服务暂未配置，无法发送验证码。";
  if (message.includes("Failed to send OTP")) return "验证码邮件发送失败，请稍后再试。";
  return "验证码发送失败，请稍后再试。";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const result = await requestEmailOtp(body.email ?? "");

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      devCode: process.env.NODE_ENV === "production" ? undefined : result.devCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request email OTP.";
    const status = message.includes("Too many") ? 429 : message.includes("DATABASE_URL") ? 503 : 400;

    return NextResponse.json(
      {
        ok: false,
        message: getClientErrorMessage(message),
      },
      { status }
    );
  }
}
