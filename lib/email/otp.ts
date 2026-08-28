import crypto from "node:crypto";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

const OTP_TTL_MINUTES = 10;
const MAX_RECENT_REQUESTS = 3;
const MAX_ATTEMPTS = 5;

export type EmailOtpRequestResult = {
  sent: boolean;
  devCode?: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(email: string, code: string) {
  const secret = process.env.AUTH_SECRET ?? "wise-dev-secret";
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${secret}`)
    .digest("hex");
}

function buildOtpEmailHtml(code: string) {
  return `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Wise Invest 邮箱验证码</title>
  </head>
  <body style="margin:0;background:#f5f7fb;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'PingFang SC','Microsoft YaHei',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;overflow:hidden;border-radius:24px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,#f59e0b,#facc15,#14b8a6);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:34px 34px 18px;">
                <div style="display:inline-block;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:800;letter-spacing:0.02em;">
                  Wise ID
                </div>
                <h1 style="margin:22px 0 8px;font-size:28px;line-height:1.25;font-weight:900;color:#020617;">
                  Wise Invest 邮箱验证码
                </h1>
                <p style="margin:0;color:#64748b;font-size:15px;line-height:1.8;">
                  你正在注册 Wise Invest 账户。请复制下面的 6 位验证码，回到注册页面完成邮箱验证。
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 34px 18px;">
                <div style="border-radius:22px;border:1px solid #fcd34d;background:linear-gradient(135deg,#fffbeb 0%,#ffffff 52%,#f8fafc 100%);padding:24px;text-align:center;">
                  <p style="margin:0 0 12px;color:#92400e;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
                    Verification Code
                  </p>
                  <div style="display:inline-block;user-select:all;-webkit-user-select:all;border-radius:18px;background:#020617;color:#facc15;padding:18px 26px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:38px;line-height:1;font-weight:900;letter-spacing:0.18em;">
                    ${code}
                  </div>
                  <p style="margin:16px 0 0;color:#64748b;font-size:14px;line-height:1.7;">
                    验证码 10 分钟内有效，请勿转发给他人。
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 30px;">
                <div style="border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;padding:18px 20px;">
                  <p style="margin:0 0 8px;color:#0f172a;font-size:15px;font-weight:800;">安全提醒</p>
                  <p style="margin:0;color:#64748b;font-size:14px;line-height:1.8;">
                    如果不是你本人操作，可以忽略这封邮件。Wise Invest 不会通过邮件索要密码、券商账户密码、交易所密码、私钥或验证码。
                  </p>
                </div>
                <p style="margin:22px 0 0;color:#94a3b8;font-size:12px;line-height:1.7;text-align:center;">
                  Wise Invest · Wise ID · VIP · Account
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function buildOtpEmailText(code: string) {
  return [
    "Wise Invest 邮箱验证码",
    "",
    `你的验证码是：${code}`,
    "",
    "验证码 10 分钟内有效。请勿转发给他人。",
    "如果不是你本人操作，可以忽略这封邮件。",
    "Wise Invest 不会通过邮件索要密码、券商账户密码、交易所密码、私钥或验证码。",
  ].join("\n");
}

async function sendOtpEmail(email: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required for production email OTP.");
    }
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Wise Invest <login@wise-invest.org>",
      to: [email],
      subject: "Wise Invest 邮箱验证码，有效期 10 分钟",
      html: buildOtpEmailHtml(code),
      text: buildOtpEmailText(code),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send OTP email: ${response.status}`);
  }

  return true;
}

export async function requestEmailOtp(rawEmail: string): Promise<EmailOtpRequestResult> {
  const email = normalizeEmail(rawEmail);

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Invalid email address.");
  }

  const prisma = getPrisma();
  const recentWindow = new Date(Date.now() - 10 * 60 * 1000);
  const recentRequests = await prisma.emailOtp.count({
    where: {
      email,
      createdAt: {
        gte: recentWindow,
      },
    },
  });

  if (recentRequests >= MAX_RECENT_REQUESTS) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: {
      email,
      codeHash: hashOtp(email, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  const sent = await sendOtpEmail(email, code);
  return process.env.NODE_ENV === "production" ? { sent } : { sent, devCode: sent ? undefined : code };
}

export async function verifyEmailOtp(rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return false;

  const prisma = getPrisma();
  const otp = await prisma.emailOtp.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp || otp.attempts >= MAX_ATTEMPTS) return false;

  const isMatch = otp.codeHash === hashOtp(email, code);
  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: {
      attempts: { increment: 1 },
      consumedAt: isMatch ? new Date() : null,
    },
  });

  return isMatch;
}
