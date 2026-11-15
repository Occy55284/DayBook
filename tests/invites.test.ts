import { describe, expect, it } from "vitest";
import { formatCodeInput, inviteStatus, shareMessage } from "../lib/invites";

const now = new Date("2026-11-20T12:00:00Z");
const base = { used_at: null, revoked_at: null, expires_at: "2026-11-27T12:00:00Z" };

describe("inviteStatus", () => {
  it("waiting while unused, unrevoked and in date", () => {
    expect(inviteStatus(base, now)).toBe("waiting");
  });
  it("used wins over everything", () => {
    expect(inviteStatus({ ...base, used_at: "2026-11-21T00:00:00Z", revoked_at: "2026-11-22T00:00:00Z" }, now)).toBe("used");
  });
  it("revoked", () => {
    expect(inviteStatus({ ...base, revoked_at: "2026-11-21T00:00:00Z" }, now)).toBe("revoked");
  });
  it("expired once the time has passed (and exactly at the moment)", () => {
    expect(inviteStatus({ ...base, expires_at: "2026-11-19T12:00:00Z" }, now)).toBe("expired");
    expect(inviteStatus({ ...base, expires_at: "2026-11-20T12:00:00Z" }, now)).toBe("expired");
  });
  it("a revoked code that has also expired shows as revoked", () => {
    expect(inviteStatus({ ...base, revoked_at: "2026-11-01T00:00:00Z", expires_at: "2026-11-02T00:00:00Z" }, now)).toBe("revoked");
  });
});

describe("formatCodeInput", () => {
  it("groups as you type", () => {
    expect(formatCodeInput("k")).toBe("K");
    expect(formatCodeInput("k7qm")).toBe("K7QM");
    expect(formatCodeInput("k7qmx")).toBe("K7QM-X");
    expect(formatCodeInput("k7qmx2pa9wtd")).toBe("K7QM-X2PA-9WTD");
  });
  it("ignores spaces, dashes and odd characters, so pasting works", () => {
    expect(formatCodeInput("  k7qm - x2pa . 9wtd  ")).toBe("K7QM-X2PA-9WTD");
  });
  it("never goes past 12 characters", () => {
    expect(formatCodeInput("K7QMX2PA9WTDEXTRA")).toBe("K7QM-X2PA-9WTD");
  });
  it("is empty for nothing", () => {
    expect(formatCodeInput("")).toBe("");
    expect(formatCodeInput("---")).toBe("");
  });
});

describe("shareMessage", () => {
  it("names the code, the site and the expiry date", () => {
    const m = shareMessage("K7QM-X2PA-9WTD", "https://daybook.example", "2026-11-27T12:00:00Z");
    expect(m).toContain("K7QM-X2PA-9WTD");
    expect(m).toContain("https://daybook.example");
    expect(m).toContain("27 November");
    expect(m).toContain("Join with an invite code");
  });
});
