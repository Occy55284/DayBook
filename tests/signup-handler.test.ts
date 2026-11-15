import { beforeEach, describe, expect, it } from "vitest";
import {
  CORS_HEADERS, FAILURE_WINDOW_MINUTES, MAX_FAILURES, handleSignup, normaliseCode, type CreateUserResult, type InviteStore,
} from "../supabase/functions/signup-with-invite/handler";

const GOOD_CODE = "K7QM-X2PA-9WTD";
const NOW = new Date("2026-11-20T12:00:00Z");

// An in-memory stand-in for the database.
class FakeStore implements InviteStore {
  validCodes = new Set<string>([GOOD_CODE]);
  used = new Map<string, string | null>(); // code -> user id (null while only reserved)
  failures: Date[] = [];
  users = new Map<string, string>(); // email -> user id
  claims: string[] = [];
  createUserOverride: (() => Promise<CreateUserResult>) | null = null;
  createdWith: { email: string; password: string }[] = [];

  async recentFailures(sinceIso: string) {
    return this.failures.filter((d) => d.toISOString() >= sinceIso).length;
  }
  async recordFailure() {
    this.failures.push(NOW);
  }
  async claimInvite(code: string) {
    if (!this.validCodes.has(code) || this.used.has(code)) return null;
    this.used.set(code, null);
    this.claims.push(code);
    return code; // the code doubles as the id here
  }
  async releaseInvite(id: string) {
    if (this.used.get(id) === null) this.used.delete(id);
  }
  async markInviteUsed(id: string, userId: string) {
    this.used.set(id, userId);
  }
  async createUser(email: string, password: string): Promise<CreateUserResult> {
    this.createdWith.push({ email, password });
    if (this.createUserOverride) return this.createUserOverride();
    if (this.users.has(email)) return { error: "exists", message: "already registered" };
    const id = `user-${this.users.size + 1}`;
    this.users.set(email, id);
    return { userId: id };
  }
}

const post = (body: unknown) =>
  new Request("https://example.test/signup", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
const good = { code: GOOD_CODE, email: "Sam@Example.com ", password: "correct horse" };

let store: FakeStore;
const run = (req: Request) => handleSignup(req, store, () => NOW);
const json = async (res: Response) => (await res.json()) as { ok?: boolean; error?: string };

beforeEach(() => {
  store = new FakeStore();
});

describe("normaliseCode", () => {
  it("accepts any casing, spaces and dashes", () => {
    expect(normaliseCode("k7qm-x2pa-9wtd")).toBe(GOOD_CODE);
    expect(normaliseCode(" k7qm x2pa 9wtd ")).toBe(GOOD_CODE);
    expect(normaliseCode("K7QMX2PA9WTD")).toBe(GOOD_CODE);
  });
  it("rejects anything that is not 12 letters or digits", () => {
    expect(normaliseCode("K7QM-X2PA")).toBeNull();
    expect(normaliseCode("K7QM-X2PA-9WTD-1")).toBeNull();
    expect(normaliseCode("")).toBeNull();
    expect(normaliseCode(123456789012)).toBeNull();
    expect(normaliseCode(null)).toBeNull();
  });
});

describe("joining with a code", () => {
  it("creates the account and uses up the code", async () => {
    const res = await run(post(good));
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ ok: true });
    expect(store.used.get(GOOD_CODE)).toBe("user-1");
  });

  it("tidies the email (trim, lower case) and accepts a loosely typed code", async () => {
    await run(post({ ...good, code: "k7qm x2pa 9wtd" }));
    expect(store.createdWith).toEqual([{ email: "sam@example.com", password: "correct horse" }]);
  });

  it("a code only works once", async () => {
    expect((await run(post(good))).status).toBe(200);
    const second = await run(post({ ...good, email: "other@example.com" }));
    expect(second.status).toBe(400);
    expect((await json(second)).error).toMatch(/isn't valid, has expired or has already been used/);
    expect(store.users.size).toBe(1);
  });

  it("a wrong code is refused with the same message as an expired one, and no account is made", async () => {
    const res = await run(post({ ...good, code: "AAAA-BBBB-CCCC" }));
    expect(res.status).toBe(400);
    expect((await json(res)).error).toMatch(/isn't valid, has expired or has already been used/);
    expect(store.users.size).toBe(0);
    expect(store.failures).toHaveLength(1);
  });

  it("a badly formed code counts as a failed attempt too", async () => {
    const res = await run(post({ ...good, code: "nope" }));
    expect(res.status).toBe(400);
    expect(store.failures).toHaveLength(1);
  });
});

describe("mistakes don't use up a code", () => {
  it("missing boxes", async () => {
    for (const bad of [{ ...good, email: "" }, { ...good, password: "" }, { ...good, code: "" }, {}]) {
      expect((await run(post(bad))).status).toBe(400);
    }
    expect(store.claims).toHaveLength(0);
  });

  it("an email that doesn't look right", async () => {
    const res = await run(post({ ...good, email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await json(res)).error).toMatch(/email/i);
    expect(store.claims).toHaveLength(0);
  });

  it("a password that is too short or too long", async () => {
    expect((await run(post({ ...good, password: "short" }))).status).toBe(400);
    expect((await run(post({ ...good, password: "x".repeat(73) }))).status).toBe(400);
    expect(store.claims).toHaveLength(0);
  });

  it("text that is not JSON", async () => {
    expect((await run(post("hello"))).status).toBe(400);
    expect(store.claims).toHaveLength(0);
  });
});

describe("when the account can't be made, the code is given back", () => {
  it("email already has an account", async () => {
    store.users.set("sam@example.com", "existing");
    const res = await run(post(good));
    expect(res.status).toBe(409);
    expect((await json(res)).error).toMatch(/already an account/);
    expect(store.used.has(GOOD_CODE)).toBe(false); // can be used again
  });

  it("password too easy to guess", async () => {
    store.createUserOverride = async () => ({ error: "weak_password", message: "weak" });
    const res = await run(post(good));
    expect(res.status).toBe(400);
    expect(store.used.has(GOOD_CODE)).toBe(false);
  });

  it("any other failure", async () => {
    store.createUserOverride = async () => ({ error: "other", message: "boom" });
    const res = await run(post(good));
    expect(res.status).toBe(500);
    expect(store.used.has(GOOD_CODE)).toBe(false);
  });

  it("something throws halfway", async () => {
    store.createUserOverride = async () => {
      throw new Error("network down");
    };
    const res = await run(post(good));
    expect(res.status).toBe(500);
    expect(store.used.has(GOOD_CODE)).toBe(false);
  });
});

describe("guessing is slowed down", () => {
  it(`after ${MAX_FAILURES} bad codes in ${FAILURE_WINDOW_MINUTES} minutes, even a good code is refused for a while`, async () => {
    store.failures = Array.from({ length: MAX_FAILURES }, () => new Date(NOW.getTime() - 60_000));
    const res = await run(post(good));
    expect(res.status).toBe(429);
    expect(store.claims).toHaveLength(0);
  });

  it("old failures stop counting", async () => {
    store.failures = Array.from({ length: MAX_FAILURES }, () => new Date(NOW.getTime() - (FAILURE_WINDOW_MINUTES + 1) * 60_000));
    expect((await run(post(good))).status).toBe(200);
  });

  it("one under the limit is still allowed", async () => {
    store.failures = Array.from({ length: MAX_FAILURES - 1 }, () => new Date(NOW.getTime() - 60_000));
    expect((await run(post(good))).status).toBe(200);
  });
});

describe("web basics", () => {
  it("answers the browser's pre-check (OPTIONS)", async () => {
    const res = await run(new Request("https://example.test/signup", { method: "OPTIONS" }));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(CORS_HEADERS["Access-Control-Allow-Origin"]);
  });

  it("refuses anything but POST", async () => {
    expect((await run(new Request("https://example.test/signup", { method: "GET" }))).status).toBe(405);
  });

  it("every answer carries the CORS header so the app can read it", async () => {
    const res = await run(post({}));
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
