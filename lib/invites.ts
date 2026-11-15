// Small helpers for invite codes (the app side; the rules themselves live in the sign-up function).

export type Invite = {
  id: string;
  code: string;
  note: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export type InviteStatus = "waiting" | "used" | "expired" | "revoked";

// Where a code stands right now.
export function inviteStatus(inv: Pick<Invite, "used_at" | "revoked_at" | "expires_at">, now: Date): InviteStatus {
  if (inv.used_at) return "used";
  if (inv.revoked_at) return "revoked";
  if (new Date(inv.expires_at) <= now) return "expired";
  return "waiting";
}

// Tidies what someone types or pastes into the code box: capitals, no spaces or odd characters,
// grouped like K7QM-X2PA-9WTD, and never more than 12 characters.
export function formatCodeInput(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return clean.match(/.{1,4}/g)?.join("-") ?? "";
}

// The message the owner copies and sends to a new member.
export function shareMessage(code: string, origin: string, expiresAt: string): string {
  const until = new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return `You're invited to Daybook, a trading journal. Open ${origin}, tap "Join with an invite code" and enter ${code}. The code works once and expires on ${until}.`;
}
