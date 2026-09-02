const baseDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: ws:",
  "frame-src https://www.youtube.com https://player.bilibili.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
];

function assertSafeOrigin(origin: string) {
  const parsed = new URL(origin);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new Error("CSP form-action source must be an HTTP(S) origin.");
  }
}

export function buildContentSecurityPolicy(formActionOrigins: readonly string[] = []) {
  const origins = Array.from(new Set(formActionOrigins));
  origins.forEach(assertSafeOrigin);

  return [
    ...baseDirectives,
    `form-action 'self'${origins.length ? ` ${origins.join(" ")}` : ""}`,
  ].join("; ");
}
