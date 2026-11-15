import { beforeEach, describe, expect, it } from "vitest";
import { CONFIRM_WORD, CORS_HEADERS, handleDelete, type DeleteStore, type SignedInUser } from "../supabase/functions/delete-account/handler";

const ME: SignedInUser = { id: "user-me", email: "me@example.com" };
const OTHER: SignedInUser = { id: "user-other", email: "other@example.com" };

// An in-memory stand-in for the database.
class FakeStore implements DeleteStore {
  tokens = new Map<string, SignedInUser>([["good-token", ME], ["other-token", OTHER]]);
  passwords = new Map<string, string>([[ME.email, "my-password-1"], [OTHER.email, "other-password"]]);
  admins = new Set<string>();
  deleted: string[] = [];
  passwordChecks: string[] = [];
  failDelete = false;
  throwOnLookup = false;

  async getUser(token: string) {
    if (this.throwOnLookup) throw new Error("network down");
    return this.tokens.get(token) ?? null;
  }
  async verifyPassword(email: string, password: string) {
    this.passwordChecks.push(email);
    return this.passwords.get(email) === password;
  }
  async isOnlyAdmin(userId: string) {
    return this.admins.size === 1 && this.admins.has(userId);
  }
  async deleteUser(userId: string) {
    if (this.failDelete) return false;
    this.deleted.push(userId);
    return true;
  }
}

const call = (body: unknown, token: string | null = "good-token", method = "POST") =>
  new Request("https://example.test/delete", {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
const good = { confirm: CONFIRM_WORD, password: "my-password-1" };
const json = async (res: Response) => (await res.json()) as { ok?: boolean; error?: string };

let store: FakeStore;
beforeEach(() => {
  store = new FakeStore();
});

describe("deleting your own account", () => {
  it("deletes the account of the person who is signed in", async () => {
    const res = await handleDelete(call(good), store);
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ ok: true });
    expect(store.deleted).toEqual(["user-me"]);
  });

  it("works for an admin as long as they are not the only one", async () => {
    store.admins = new Set(["user-me", "user-other"]);
    expect((await handleDelete(call(good), store)).status).toBe(200);
    expect(store.deleted).toEqual(["user-me"]);
  });
});

describe("only the signed-in person's own account, never someone else's", () => {
  it("ignores any account id in the request and deletes only the verified person", async () => {
    const sneaky = { ...good, userId: "user-other", user_id: "user-other", id: "user-other", email: "other@example.com" };
    const res = await handleDelete(call(sneaky), store);
    expect(res.status).toBe(200);
    expect(store.deleted).toEqual(["user-me"]);
  });

  it("a different person's token can't delete me, and uses their own password", async () => {
    const res = await handleDelete(call({ confirm: CONFIRM_WORD, password: "my-password-1" }, "other-token"), store);
    expect(res.status).toBe(403); // my password is not their password
    expect(store.deleted).toEqual([]);
  });
});

describe("not signed in", () => {
  it("no token", async () => {
    const res = await handleDelete(call(good, null), store);
    expect(res.status).toBe(401);
    expect(store.deleted).toEqual([]);
    expect(store.passwordChecks).toEqual([]);
  });

  it("a token that isn't a real signed-in person (e.g. the public anon key)", async () => {
    const res = await handleDelete(call(good, "anon-key-looking-token"), store);
    expect(res.status).toBe(401);
    expect(store.deleted).toEqual([]);
  });

  it("a malformed Authorization header", async () => {
    const req = new Request("https://example.test/delete", { method: "POST", headers: { Authorization: "good-token" }, body: JSON.stringify(good) });
    expect((await handleDelete(req, store)).status).toBe(401);
    expect(store.deleted).toEqual([]);
  });
});

describe("making sure they mean it", () => {
  it("must type DELETE exactly", async () => {
    for (const confirm of ["delete", "Delete", "DELET", "", undefined, "DELETE "]) {
      const res = await handleDelete(call({ ...good, confirm }), store);
      expect(res.status).toBe(400);
    }
    expect(store.deleted).toEqual([]);
    expect(store.passwordChecks).toEqual([]);
  });

  it("must give a password", async () => {
    expect((await handleDelete(call({ confirm: CONFIRM_WORD }), store)).status).toBe(400);
    expect((await handleDelete(call({ confirm: CONFIRM_WORD, password: "" }), store)).status).toBe(400);
    expect(store.deleted).toEqual([]);
  });

  it("a wrong password does not delete anything", async () => {
    const res = await handleDelete(call({ confirm: CONFIRM_WORD, password: "wrong" }), store);
    expect(res.status).toBe(403);
    expect((await json(res)).error).toMatch(/password/);
    expect(store.deleted).toEqual([]);
  });

  it("text that is not JSON", async () => {
    expect((await handleDelete(call("hello"), store)).status).toBe(400);
    expect(store.deleted).toEqual([]);
  });
});

describe("the only admin", () => {
  it("is refused, with a clear reason, and nothing is deleted", async () => {
    store.admins = new Set(["user-me"]);
    const res = await handleDelete(call(good), store);
    expect(res.status).toBe(409);
    expect((await json(res)).error).toMatch(/only admin/);
    expect(store.deleted).toEqual([]);
  });

  it("someone else being the only admin does not stop me", async () => {
    store.admins = new Set(["user-other"]);
    expect((await handleDelete(call(good), store)).status).toBe(200);
  });
});

describe("when something goes wrong", () => {
  it("a failed delete says so and doesn't claim success", async () => {
    store.failDelete = true;
    const res = await handleDelete(call(good), store);
    expect(res.status).toBe(500);
    expect((await json(res)).error).toMatch(/was not deleted/);
  });

  it("an unexpected error says so and deletes nothing", async () => {
    store.throwOnLookup = true;
    const res = await handleDelete(call(good), store);
    expect(res.status).toBe(500);
    expect(store.deleted).toEqual([]);
  });
});

describe("web basics", () => {
  it("answers the browser's pre-check (OPTIONS) without needing a login", async () => {
    const res = await handleDelete(new Request("https://example.test/delete", { method: "OPTIONS" }), store);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(CORS_HEADERS["Access-Control-Allow-Origin"]);
  });

  it("refuses anything but POST", async () => {
    expect((await handleDelete(call(good, "good-token", "GET"), store)).status).toBe(405);
    expect(store.deleted).toEqual([]);
  });

  it("every answer carries the CORS header", async () => {
    const res = await handleDelete(call(good, null), store);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
