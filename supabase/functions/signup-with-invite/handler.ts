// The rules for joining Daybook with an invite code.
// Kept free of any server specifics so it can be tested; index.ts plugs in the real database.

export type CreateUserResult =
  | { userId: string }
  | { error: "exists" | "weak_password" | "other"; message: string };

// Everything the rules need from the database.
export type InviteStore = {
  recentFailures(sinceIso: string): Promise<number>;
  recordFailure(): Promise<void>;
  // Atomically marks a valid, unused, unexpired, unrevoked code as used. Returns the invite id, or null if it isn't usable.
  claimInvite(code: string, nowIso: string): Promise<string | null>;
  releaseInvite(id: string): Promise<void>;
  markInviteUsed(id: string, userId: string): Promise<void>;
  createUser(email: string, password: string): Promise<CreateUserResult>;
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const MAX_FAILURES = 30; // bad codes allowed ...
export const FAILURE_WINDOW_MINUTES = 10; // ... in this many minutes, across everyone
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // the most the password scrambler uses

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

// "k7qm x2pa-9wtd" -> "K7QM-X2PA-9WTD". Returns null unless it is exactly 12 letters/digits.
export function normaliseCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 12) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

const looksLikeEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const BAD_CODE = "That invite code isn't valid, has expired or has already been used.";

export async function handleSignup(req: Request, store: InviteStore, now: () => Date = () => new Date()): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Please fill in every box." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const code = normaliseCode(body.code);

  // Check the simple things first, so a typo never uses up an invite code.
  if (!email || !password || typeof body.code !== "string" || !body.code.trim()) {
    return reply(400, { error: "Please fill in every box." });
  }
  if (!looksLikeEmail(email)) return reply(400, { error: "That email address doesn't look right." });
  if (password.length < MIN_PASSWORD) return reply(400, { error: `Choose a password of at least ${MIN_PASSWORD} characters.` });
  if (password.length > MAX_PASSWORD) return reply(400, { error: `Choose a password of ${MAX_PASSWORD} characters or fewer.` });

  // Slow down anyone guessing codes (counted across everyone).
  const since = new Date(now().getTime() - FAILURE_WINDOW_MINUTES * 60_000).toISOString();
  if ((await store.recentFailures(since)) >= MAX_FAILURES) {
    return reply(429, { error: "Too many attempts. Please wait a few minutes and try again." });
  }

  if (!code) {
    await store.recordFailure();
    return reply(400, { error: BAD_CODE });
  }

  const inviteId = await store.claimInvite(code, now().toISOString());
  if (!inviteId) {
    await store.recordFailure();
    return reply(400, { error: BAD_CODE });
  }

  // From here the code is reserved. If anything goes wrong, give it back so it isn't wasted.
  try {
    const created = await store.createUser(email, password);
    if ("error" in created) {
      await store.releaseInvite(inviteId);
      if (created.error === "exists") {
        return reply(409, { error: "There's already an account with that email. Try signing in, or use Forgot password." });
      }
      if (created.error === "weak_password") {
        return reply(400, { error: "That password is too easy to guess. Try a longer or less common one." });
      }
      return reply(500, { error: "Something went wrong. Please try again." });
    }
    await store.markInviteUsed(inviteId, created.userId);
    return reply(200, { ok: true });
  } catch {
    await store.releaseInvite(inviteId).catch(() => {});
    return reply(500, { error: "Something went wrong. Please try again." });
  }
}
