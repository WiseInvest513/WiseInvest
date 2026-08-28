import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function checkFile(relativePath, patterns = []) {
  check(exists(relativePath), `Missing required file: ${relativePath}`);
  if (!exists(relativePath)) return;

  const content = read(relativePath);
  for (const pattern of patterns) {
    const ok = pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern);
    check(ok, `File ${relativePath} is missing expected marker: ${pattern.toString()}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

[
  "next-auth",
  "@auth/prisma-adapter",
  "prisma",
  "@prisma/client",
  "@prisma/adapter-pg",
  "pg",
].forEach((name) => {
  check(Boolean(dependencies[name]), `Missing dependency: ${name}`);
});

[
  "prisma:generate",
  "prisma:validate",
  "prisma:migrate:deploy",
  "vip:seed",
  "wise:v1:verify",
].forEach((scriptName) => {
  check(Boolean(packageJson.scripts?.[scriptName]), `Missing package script: ${scriptName}`);
});

checkFile("docs/product-specs/wise-id-vip-v1.md", [
  "Status: Approved product direction",
  "Never collect:",
  "First make Wise Account + Wise VIP reliable.",
]);
checkFile("docs/architecture/auth-sso.md", [
  "Do not depend on a `.wise-invest.org` shared cookie",
  "Authorization Code + PKCE",
]);
checkFile("docs/deployment/wise-id-vip-v1-runbook.md", [
  "npx prisma migrate deploy",
  "npm run vip:seed",
]);
checkFile("app/robots.ts", ['"/admin/"', '"/account/"', '"/login"']);
checkFile("middleware.ts", ["authjs.session-token", 'matcher: ["/account/:path*", "/admin/:path*"]']);

checkFile("prisma/schema.prisma", [
  "model User",
  "model Account",
  "model EmailOtp",
  "model Partner",
  "model PartnerAccount",
  "model QualificationMetric",
  "model Entitlement",
  "model AuditLog",
  "model SsoClient",
  "@@unique([userId, key])",
  "enum MembershipTier",
  "VIP_PLUS",
]);
checkFile("prisma/migrations/20260828000000_wise_id_vip_v1/migration.sql", [
  'CREATE TABLE "users"',
  'CREATE TABLE "partner_accounts"',
  'CREATE TABLE "audit_logs"',
  'CREATE UNIQUE INDEX "entitlements_user_id_key_key"',
]);

checkFile("auth.ts", ["WisePrismaAdapter", "Credentials", "Google", "GitHub", 'strategy: "jwt"', "wise-invest-local-auth-secret"]);
checkFile("app/api/auth/[...nextauth]/route.ts", ["runtime", "nodejs"]);
checkFile("app/api/auth/email-otp/request/route.ts", ["requestEmailOtp"]);
checkFile("lib/email/otp.ts", ["codeHash", "sha256", "consumedAt", "MAX_ATTEMPTS"]);
check(!/model EmailOtp[\s\S]*\bcode\s+String/.test(read("prisma/schema.prisma")), "Email OTP schema should not include a plaintext code field.");
const otpCreateBlock = read("lib/email/otp.ts").match(/prisma\.emailOtp\.create\(\{[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
check(Boolean(otpCreateBlock), "Email OTP implementation should create an emailOtp record.");
check(!/\n\s*code\s*:/.test(otpCreateBlock), "Email OTP implementation should not persist a plaintext code field.");

checkFile("app/login/page.tsx", ["Google", "GitHub", "邮箱密码登录"]);
checkFile("app/login/login-form.tsx", ["PasswordInput", "忘记密码", "登录账户"]);
checkFile("app/register/page.tsx", ["Google", "GitHub", "邮箱验证码注册"]);
checkFile("app/register/register-form.tsx", ["接收验证码", "完成注册"]);
checkFile("app/reset-password/page.tsx", ["重设密码", "邮箱验证码"]);
checkFile("app/api/auth/password-reset/route.ts", ["verifyEmailOtp", "updateUserPassword"]);
checkFile("app/api/account/password/route.ts", ["verifyPassword", "updateUserPassword"]);
checkFile("app/api/dev/mock-login/route.ts", ["WISE_DEV_PREVIEW_COOKIE", "isDevPreviewEnabled"]);
checkFile("lib/identity/dev-preview.ts", ['process.env.NODE_ENV !== "production"']);
checkFile("app/account/page.tsx", ["requireWiseUser", "会员升级路径", "账户设置"]);
checkFile("app/vip/page.tsx", ["Wise VIP", "登录并申请 VIP"]);
checkFile("app/account/vip/page.tsx", ["BindingForm", "会员等级", "getPartnerAccountStatusLabel"]);
checkFile("app/account/vip/binding-form.tsx", ["提交审核", "Account ID"]);

checkFile("app/api/account/partner-accounts/route.ts", [
  'status: "PENDING"',
  "checkVipBindingSubmitLimit",
  "PARTNER_ACCOUNT_SUBMITTED",
]);
check(!read("app/api/account/partner-accounts/route.ts").includes("membershipTier"), "User binding submission API must not update membershipTier.");

[
  "app/admin/page.tsx",
  "app/admin/vip/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/users/[id]/page.tsx",
  "app/admin/partners/page.tsx",
  "app/admin/audit/page.tsx",
  "app/admin/system/page.tsx",
].forEach((file) => checkFile(file, ["requireAdminUser"]));

checkFile("app/api/admin/partner-accounts/[id]/route.ts", [
  'session.user.role !== "ADMIN"',
  "refreshUserMembership",
  "MEMBERSHIP_UPGRADED",
  "checkAdminMutationLimit",
]);
checkFile("app/api/admin/users/[id]/membership/route.ts", [
  'session.user.role !== "ADMIN"',
  "setUserMembership",
  "MEMBERSHIP_UPGRADED",
  "MEMBERSHIP_DOWNGRADED",
]);
checkFile("app/api/admin/partners/route.ts", [
  'session.user.role !== "ADMIN"',
  "PARTNER_CREATED",
  "checkAdminMutationLimit",
]);
checkFile("app/api/admin/partners/[id]/route.ts", [
  'session.user.role !== "ADMIN"',
  "PARTNER_UPDATED",
  "checkAdminMutationLimit",
]);

checkFile("lib/auth/authorization.ts", ["hasEntitlement", "isWiseVipOrAbove"]);
checkFile("lib/vip/membership.ts", ["refreshUserMembership", "setUserMembership", "vip_group", "vip_plus"]);
checkFile("lib/vip/api-guards.ts", ["checkVipBindingSubmitLimit", "checkAdminMutationLimit"]);
checkFile("scripts/seed-wise-vip.mjs", ["DATABASE_URL", "upsert", "galaxy-securities", "mp-card"]);

if (failures.length > 0) {
  console.error("Wise ID + VIP V1 verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Wise ID + VIP V1 verification passed.");
