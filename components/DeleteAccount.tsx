"use client";
import { useState } from "react";
import { deleteMyAccount } from "@/lib/auth";

// Lets someone permanently delete their own account and everything in it.
// Kept behind a button, and the final button stays off until the password and the word DELETE are entered.
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = confirm === "DELETE" && password.length > 0 && !busy;

  function close() {
    setOpen(false);
    setPassword("");
    setConfirm("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const problem = await deleteMyAccount(password);
    if (problem) {
      setError(problem);
      setBusy(false);
      return;
    }
    // Gone. Go back to the sign-in screen, which says so.
    window.location.replace("/?deleted=1");
  }

  return (
    <section className="card danger-card" style={{ marginBottom: 16 }} aria-labelledby="delete-title">
      <h2 id="delete-title" className="label" style={{ margin: 0 }}>Delete my account</h2>
      <p className="amount-hint muted" style={{ marginTop: 6 }}>
        This permanently deletes your account and everything in it: all your trades, lot sizes, commissions and
        settings. It can&apos;t be undone. Tip: download your data first (see &quot;Your data&quot; above).
      </p>

      {!open ? (
        <button className="b-clear signout" style={{ marginTop: 12 }} aria-expanded={false} aria-controls="delete-form" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      ) : (
        <form id="delete-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="delete-password">Your password</label>
            <input id="delete-password" className="settings-input" style={{ fontSize: 18 }} type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="delete-confirm">Type DELETE to confirm</label>
            <input id="delete-confirm" className="settings-input" style={{ fontSize: 18 }} type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="neg amount-hint" role="alert">{error}</p>}
          <button className="b-danger signout" style={{ marginTop: 12 }} type="submit" disabled={!ready}>
            {busy ? "Deleting…" : "Permanently delete my account"}
          </button>
          <button className="link-btn" style={{ width: "100%" }} type="button" onClick={close} disabled={busy}>Cancel</button>
        </form>
      )}
    </section>
  );
}
