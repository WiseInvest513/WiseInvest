import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  timingSafeEqual,
  verify,
  type KeyObject,
} from "crypto";

type JwtClaims = Record<string, unknown> & {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
};

const globalForSso = globalThis as unknown as {
  wiseSsoPrivateKey?: KeyObject;
};

export function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function randomToken(bytes = 32) {
  return base64url(randomBytes(bytes));
}

export function hashToken(token: string) {
  return `sha256:${base64url(createHash("sha256").update(token).digest())}`;
}

export function verifyHashedToken(token: string, expectedHash?: string | null) {
  if (!expectedHash) return false;
  const actual = Buffer.from(hashToken(token));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyPkceChallenge(verifier: string, challenge: string, method: string | null | undefined) {
  if (method !== "S256") return false;
  return base64url(createHash("sha256").update(verifier).digest()) === challenge;
}

function getPrivateKey() {
  const rawKey = process.env.WISE_SSO_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (rawKey) return createPrivateKey(rawKey);

  if (process.env.NODE_ENV === "production") {
    throw new Error("WISE_SSO_PRIVATE_KEY is required for Wise SSO in production.");
  }

  if (!globalForSso.wiseSsoPrivateKey) {
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    globalForSso.wiseSsoPrivateKey = pair.privateKey;
  }

  return globalForSso.wiseSsoPrivateKey;
}

function getPublicKey() {
  return createPublicKey(getPrivateKey());
}

export function getSsoIssuer() {
  const issuer = process.env.WISE_SSO_ISSUER
    ?? process.env.AUTH_URL
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "http://127.0.0.1:3002";

  return issuer.replace(/\/$/, "");
}

export function getSsoKeyId() {
  if (process.env.WISE_SSO_KEY_ID) return process.env.WISE_SSO_KEY_ID;
  const publicDer = getPublicKey().export({ format: "der", type: "spki" });
  return base64url(createHash("sha256").update(publicDer).digest()).slice(0, 16);
}

export function getPublicJwk() {
  const jwk = getPublicKey().export({ format: "jwk" });
  return {
    ...jwk,
    kid: getSsoKeyId(),
    use: "sig",
    alg: "RS256",
  };
}

export function signJwt(claims: JwtClaims) {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: getSsoKeyId(),
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), getPrivateKey());
  return `${signingInput}.${base64url(signature)}`;
}

export function verifyJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format.");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: string; kid?: string };
  if (header.alg !== "RS256") throw new Error("Unsupported token algorithm.");

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const ok = verify(
    "RSA-SHA256",
    Buffer.from(signingInput),
    getPublicKey(),
    Buffer.from(encodedSignature, "base64url")
  );
  if (!ok) throw new Error("Invalid token signature.");

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as JwtClaims;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) throw new Error("Token expired.");
  if (payload.iss !== getSsoIssuer()) throw new Error("Invalid issuer.");

  return payload;
}
