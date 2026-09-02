type RedirectUriAllowlist = {
  allowedRedirectUris: readonly string[];
};

export type RegisteredRedirectUri = {
  value: string;
  origin: string;
};

const localHttpHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function validateRedirectUri(value: string): RegisteredRedirectUri {
  if (!value || value !== value.trim()) {
    throw new Error("回调地址不能为空或包含首尾空格。");
  }
  if (value.length > 2048) throw new Error("回调地址过长。");
  if (value.includes("*")) throw new Error("回调地址不允许使用通配符。");
  if (value.includes("\\")) throw new Error("回调地址不能包含反斜杠。");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("回调地址格式无效。");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("回调地址必须是 http 或 https。");
  }
  if (url.username || url.password) throw new Error("回调地址不能包含用户名或密码。");
  if (url.hash) throw new Error("回调地址不能包含 hash。");
  if (url.protocol === "http:" && !localHttpHosts.has(url.hostname.toLowerCase())) {
    throw new Error("生产回调地址必须使用 https。");
  }

  return { value, origin: url.origin };
}

export function parseRedirectUriAllowlist(value: string[] | string | undefined) {
  const entries = (Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/))
    .map((item) => item.trim())
    .filter(Boolean);
  const uniqueEntries = Array.from(new Set(entries));

  if (!uniqueEntries.length) throw new Error("至少需要一个回调地址。");
  if (uniqueEntries.length > 20) throw new Error("单个客户端最多配置 20 个回调地址。");

  return uniqueEntries.map((entry) => validateRedirectUri(entry).value);
}

export function getRegisteredRedirectUri(
  client: RedirectUriAllowlist,
  redirectUri: string
): RegisteredRedirectUri | null {
  if (!redirectUri || !client.allowedRedirectUris.includes(redirectUri)) return null;

  try {
    return validateRedirectUri(redirectUri);
  } catch {
    return null;
  }
}

export function isRedirectUriAllowed(client: RedirectUriAllowlist, redirectUri: string) {
  return getRegisteredRedirectUri(client, redirectUri) !== null;
}
