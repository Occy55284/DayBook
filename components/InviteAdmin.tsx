"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Invite, inviteStatus, shareMessage } from "@/lib/invites";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// For the owner only: make invite codes, copy a message to send, and see who has used one.
// (Anyone who isn't an admin never sees this: the database simply returns nothing for them.)
export default function InviteAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [note, setNote] = useState("");
  const [days, setDays] = useState(7);
  const [fresh, setFresh] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load(): Promise<Invite[]> {
    const { data, error } = await supabase
      .from("invites")
      .select("id, code, note, created_at, expires_at, used_at, revoked_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) {
      setError(error.message);
      return [];
    }
    setInvites(data as Invite[]);
    return data as Invite[];
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("app_admins").select("user_id").maybeSingle();
      if (cancelled || !data) return;
      setIsAdmin(true);
      await load();
    })();
    return () => { cancelled = true; };
  }, []);

  if (!isAdmin) return null;

  async function create() {
    setBusy(true);
    setError(null);
    setCopied(false);
    const { data: code, error } = await supabase.rpc("create_invite", { p_note: note.trim() || null, p_days: days });
    if (error || typeof code !== "string") {
      setError(error?.message ?? "Couldn't create a code.");
      setBusy(false);
      return;
    }
    const list = await load();
    setFresh(list.find((i) => i.code === code) ?? null);
    setNote("");
    setBusy(false);
  }

  async function revoke(id: string) {
    setError(null);
    const { error } = await supabase.from("invites").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) setError(error.message);
    if (fresh?.id === id) setFresh(null);
    await load();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false); // the message is shown on screen too, so it can be copied by hand
    }
  }

  const now = new Date();
  const message = fresh ? shareMessage(fresh.code, window.location.origin, fresh.expires_at) : "";

  return (
    <section className="card" style={{ marginBottom: 16 }} aria-labelledby="invite-title">
      <h2 id="invite-title" className="label" style={{ margin: 0 }}>Invite someone</h2>
      <p className="amount-hint muted" style={{ marginTop: 6 }}>
        Make a one-time code and send it to the person. Only people with a code can join.
      </p>

      <div className="field">
        <label htmlFor="invite-note">Who is it for? (optional)</label>
        <input id="invite-note" className="settings-input" style={{ fontSize: 18 }} maxLength={80}
          value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="invite-days">Code works for</label>
        <select id="invite-days" className="settings-input" style={{ fontSize: 18 }}
          value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>
      <button className="b-save signout" style={{ marginTop: 12 }} onClick={create} disabled={busy}>
        {busy ? "Creating…" : "Create invite code"}
      </button>
      {error && <p className="neg amount-hint" role="alert">{error}</p>}

      {fresh && (
        <div className="invite-fresh" role="status">
          <div className="invite-code" aria-label={`New invite code ${fresh.code}`}>{fresh.code}</div>
          <p className="amount-hint muted">Send this message to them:</p>
          <p className="share-text">{message}</p>
          <button className="b-clear signout" onClick={() => copy(message)}>{copied ? "Copied" : "Copy message"}</button>
        </div>
      )}

      {invites.length > 0 && (
        <>
          <h3 className="field-label" style={{ marginTop: 20 }}>Recent codes</h3>
          <ul className="invite-list">
            {invites.map((inv) => {
              const status = inviteStatus(inv, now);
              return (
                <li key={inv.id} className={`invite-item ${status}`}>
                  <div>
                    <span className="invite-code-small">{inv.code}</span>
                    {inv.note && <span className="invite-note"> · {inv.note}</span>}
                    <div className="invite-status">
                      {status === "waiting" && `Waiting, valid until ${shortDate(inv.expires_at)}`}
                      {status === "used" && `Used on ${shortDate(inv.used_at as string)}`}
                      {status === "expired" && `Expired on ${shortDate(inv.expires_at)}`}
                      {status === "revoked" && "Cancelled"}
                    </div>
                  </div>
                  {status === "waiting" && (
                    <button className="link-btn" onClick={() => revoke(inv.id)} aria-label={`Cancel code ${inv.code}`}>Cancel</button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
