import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import nextEnv from "@next/env";
import { encode } from "@auth/core/jwt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.SSO_TEST_BASE_URL ?? "http://127.0.0.1:3011";
const callback = "http://localhost:3000/api/auth/callback/wise";
const clientId = "wise_sim";
const state = "sso-flow-test-state";
const secret = process.env.AUTH_SECRET ?? "wise-invest-local-auth-secret";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the SSO flow test.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hashToken(token) {
  return `sha256:${createHash("sha256").update(token).digest("base64url")}`;
}

function authorizationBody(decision, redirectUri = callback) {
  return new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email wise.membership",
    state,
    nonce: "sso-flow-test-nonce",
    code_challenge: "sso-flow-test-challenge",
    code_challenge_method: "S256",
    decision,
  });
}

async function main() {
  const [user, client] = await Promise.all([
    prisma.user.findFirst({
      select: {
        id: true,
        wiseUserId: true,
        email: true,
        name: true,
        image: true,
        membershipTier: true,
        role: true,
      },
    }),
    prisma.ssoClient.findUnique({
      where: { clientId },
      select: { enabled: true, allowedRedirectUris: true },
    }),
  ]);

  assert.ok(user, "A testable Wise user is required.");
  assert.equal(client?.enabled, true, "wise_sim must be enabled.");
  assert.ok(client.allowedRedirectUris.includes(callback), "localhost callback must be registered.");

  const token = {
    sub: user.id,
    wiseUserId: user.wiseUserId,
    email: user.email,
    name: user.name,
    picture: user.image,
    membershipTier: user.membershipTier,
    role: user.role,
  };
  const [plainSession, secureSession] = await Promise.all([
    encode({ token, secret, salt: "authjs.session-token", maxAge: 300 }),
    encode({ token, secret, salt: "__Secure-authjs.session-token", maxAge: 300 }),
  ]);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Origin: "https://www.wise-invest.org",
    Cookie: `authjs.session-token=${plainSession}; __Secure-authjs.session-token=${secureSession}`,
  };

  const denied = await fetch(`${baseUrl}/oauth/authorize`, {
    method: "POST",
    headers,
    body: authorizationBody("deny"),
    redirect: "manual",
  });
  assert.equal(denied.status, 303);
  const deniedLocation = new URL(denied.headers.get("location"));
  assert.equal(deniedLocation.origin + deniedLocation.pathname, callback);
  assert.equal(deniedLocation.searchParams.get("error"), "access_denied");
  assert.equal(deniedLocation.searchParams.get("state"), state);
  assert.equal(deniedLocation.searchParams.has("code"), false);

  const approved = await fetch(`${baseUrl}/oauth/authorize`, {
    method: "POST",
    headers,
    body: authorizationBody("approve"),
    redirect: "manual",
  });
  assert.equal(approved.status, 303);
  const approvedLocation = new URL(approved.headers.get("location"));
  const code = approvedLocation.searchParams.get("code");
  assert.equal(approvedLocation.origin + approvedLocation.pathname, callback);
  assert.ok(code);
  assert.equal(approvedLocation.searchParams.get("state"), state);
  assert.equal(approvedLocation.searchParams.has("error"), false);

  await prisma.ssoAuthorizationCode.deleteMany({ where: { codeHash: hashToken(code) } });

  const tampered = await fetch(`${baseUrl}/oauth/authorize`, {
    method: "POST",
    headers,
    body: authorizationBody("approve", `${callback}?tampered=1`),
    redirect: "manual",
  });
  assert.equal(tampered.status, 400);
  assert.equal(tampered.headers.has("location"), false);
  assert.doesNotMatch(tampered.headers.get("content-security-policy") ?? "", /localhost:3000/);

  console.log("SSO authorization flow passed: deny, approve, state, callback and tamper rejection.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
