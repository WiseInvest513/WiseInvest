import { request as httpsRequest } from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";

async function serializeBody(body: unknown) {
  if (!body) return undefined;
  if (typeof body === "string" || Buffer.isBuffer(body)) return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  return String(body);
}

function toOutgoingHeaders(headers: Headers) {
  const outgoing: Record<string, string> = {};
  headers.forEach((value, key) => {
    outgoing[key] = value;
  });
  return outgoing;
}

export function createOAuthProxyFetch(proxyUrl?: string): typeof fetch | undefined {
  if (!proxyUrl) return undefined;

  const agent = new HttpsProxyAgent(proxyUrl);

  return async function oauthProxyFetch(input, init) {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const body = await serializeBody(init?.body);
    const headers = new Headers(request.headers);

    if (body && !headers.has("content-length")) {
      headers.set("content-length", String(Buffer.byteLength(body)));
    }

    return new Promise<Response>((resolve, reject) => {
      const req = httpsRequest(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: request.method,
          headers: toOutgoingHeaders(headers),
          agent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          res.on("end", () => {
            resolve(
              new Response(Buffer.concat(chunks), {
                status: res.statusCode ?? 500,
                statusText: res.statusMessage,
                headers: res.headers as HeadersInit,
              })
            );
          });
        }
      );

      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  };
}
