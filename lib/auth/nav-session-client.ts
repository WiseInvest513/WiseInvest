"use client";

// Display-only, tab-local memory. Never use this cache for authorization or
// persist the session in browser storage. Keep only the fields the navbar uses.
export type NavSession = {
  user: { name: string | null; image: string | null };
} | null;

export const NAV_SESSION_TTL_MS = 60_000;
const ERROR_RETRY_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;

let cached: NavSession | undefined;
let expiresAt = 0;
let retryAfter = 0;
let lastError: Error | null = null;
let generation = 0;
let inFlight: Promise<NavSession> | null = null;
let controller: AbortController | null = null;
let channel: BroadcastChannel | null = null;
let stopListening: (() => void) | null = null;
const listeners = new Set<(session: NavSession) => void>();

function publish(session: NavSession) {
  listeners.forEach((listener) => listener(session));
}

function displaySession(value: unknown): NavSession {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid navbar session response");
  }
  const user = (value as { user?: unknown }).user;
  if (user == null) return null;
  if (typeof user !== "object" || Array.isArray(user)) {
    throw new Error("Invalid navbar session user");
  }
  const { name, image } = user as { name?: unknown; image?: unknown };
  if ((name != null && typeof name !== "string") || (image != null && typeof image !== "string")) {
    throw new Error("Invalid navbar session display fields");
  }
  return { user: { name: name ?? null, image: image ?? null } };
}

export function readNavSession(): Promise<NavSession> {
  // Client components can also be evaluated during SSR; never retain a user's
  // display data in a process-wide server cache.
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cached !== undefined && Date.now() < expiresAt) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  if (lastError && Date.now() < retryAfter) return Promise.reject(lastError);

  const requestGeneration = generation;
  const requestController = new AbortController();
  controller = requestController;
  let timeout: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    requestController.signal.addEventListener("abort", () => {
      reject(new Error("Navbar session request aborted"));
    }, { once: true });
    timeout = setTimeout(() => {
      requestController.abort();
      reject(new Error("Navbar session request timed out"));
    }, REQUEST_TIMEOUT_MS);
  });
  const transport = fetch("/api/auth/session", {
    cache: "no-store",
    signal: requestController.signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Navbar session request failed (${response.status})`);
    return displaySession(await response.json());
  });
  const request = Promise.race([transport, deadline])
    .then((session) => {
      // Abort alone is insufficient: an already received JSON body can finish
      // parsing after logout or a different account has signed in.
      if (requestGeneration !== generation) throw new Error("Navbar session request superseded");
      cached = session;
      expiresAt = Date.now() + NAV_SESSION_TTL_MS;
      retryAfter = 0;
      lastError = null;
      publish(session);
      return session;
    })
    .catch((error: unknown) => {
      if (requestGeneration === generation) {
        cached = undefined;
        expiresAt = 0;
        lastError = error instanceof Error ? error : new Error("Navbar session request failed");
        retryAfter = Date.now() + ERROR_RETRY_MS;
        publish(null);
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
      if (inFlight === request) {
        inFlight = null;
        controller = null;
      }
    });
  inFlight = request;
  return request;
}

export function clearNavSession() {
  generation += 1;
  controller?.abort();
  controller = null;
  inFlight = null;
  cached = undefined;
  expiresAt = 0;
  retryAfter = 0;
  lastError = null;
  publish(null);
}

function refreshVisibleSession() {
  if (listeners.size > 0 && !document.hidden) void readNavSession().catch(() => {});
}

function sessionChanged() {
  clearNavSession();
  refreshVisibleSession();
}

function openChannel() {
  try {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("next-auth");
  } catch {
    // Some embedded/privacy-restricted browsers do not allow this channel.
    return null;
  }
}

// Password sign-in without a SessionProvider does not emit a NextAuth session
// event. Notify same-tab consumers directly and other tabs with an event only,
// never with names, images, tokens, or other session contents.
export function notifyNavSessionChanged() {
  if (typeof window === "undefined") return;
  sessionChanged();
  const sender = channel ?? openChannel();
  sender?.postMessage({ event: "session", data: { trigger: "wise-account-update" } });
  if (sender !== channel) sender?.close();
}

export function subscribeNavSession(listener: (session: NavSession) => void) {
  listeners.add(listener);
  listener(cached ?? null);
  if (!stopListening) {
    const onSessionMessage = (event: MessageEvent) => {
      if (event.data?.event === "session") sessionChanged();
    };
    window.addEventListener("focus", refreshVisibleSession);
    document.addEventListener("visibilitychange", refreshVisibleSession);
    channel = openChannel();
    channel?.addEventListener("message", onSessionMessage);
    stopListening = () => {
      window.removeEventListener("focus", refreshVisibleSession);
      document.removeEventListener("visibilitychange", refreshVisibleSession);
      channel?.removeEventListener("message", onSessionMessage);
      channel?.close();
      channel = null;
      stopListening = null;
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopListening?.();
  };
}
