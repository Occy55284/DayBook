// The rules for deleting your own Daybook account.
// Kept free of any server specifics so it can be tested; index.ts plugs in the real database.
//
// Safety rules:
//  - Only a signed-in person can delete, and only THEIR OWN account. Which account is decided by their
//    verified login, never by anything in the request.
//  - They must type DELETE and re-enter their password (so a stolen, unlocked phone can't do it).
//  - The only admin can't delete themselves (nobody could make invite codes afterwards).
//  - Every check happens before anything is deleted.

export type SignedInUser = { id: string; email: string };

// Everything the rules need from the database.
export type DeleteStore = {
  // Looks up who a login token belongs to. null if the token isn't a real signed-in person's.
  getUser(token: string): Promise<SignedInUser | null>;
  verifyPassword(email: string, password: string): Promise<boolean>;
  isOnlyAdmin(userId: string): Promise<boolean>;
  // Deletes the account; the database removes everything that belongs to it. true if it worked.
  deleteUser(userId: string): Promise<boolean>;
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const CONFIRM_WORD = "DELETE";

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

function bearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

export async function handleDelete(req: Request, store: DeleteStore): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });

  try {
    // 1. Who is asking? Only a real signed-in person counts.
    const token = bearerToken(req);
    const user = token ? await store.getUser(token) : null;
    if (!user) return reply(401, { error: "Please sign in again, then try once more." });

    // 2. Did they mean it?
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return reply(400, { error: "Something was missing. Please try again." });
    }
    if (body.confirm !== CONFIRM_WORD) return reply(400, { error: `Type ${CONFIRM_WORD} in capital letters to confirm.` });
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) return reply(400, { error: "Enter your password to confirm it's you." });

    // 3. Is it really them? (A password check on top of being signed in.)
    if (!(await store.verifyPassword(user.email, password))) {
      return reply(403, { error: "That password isn't right." });
    }

    // 4. Would this leave the app without an admin?
    if (await store.isOnlyAdmin(user.id)) {
      return reply(409, {
        error: "You're the only admin, so deleting your account would leave nobody able to create invite codes. Make someone else an admin first.",
      });
    }

    // 5. Delete. Always the account that was verified above.
    if (!(await store.deleteUser(user.id))) {
      return reply(500, { error: "Something went wrong and your account was not deleted. Please try again." });
    }
    return reply(200, { ok: true });
  } catch {
    return reply(500, { error: "Something went wrong and your account was not deleted. Please try again." });
  }
}
