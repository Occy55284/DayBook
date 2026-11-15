"use client";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import type { InputHTMLAttributes } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { joinWithInvite } from "@/lib/auth";
import { formatCodeInput } from "@/lib/invites";
import { NOT_ADVICE } from "@/lib/legal";

// Did the person arrive by tapping the link in a "reset your password" email?
// Checked as soon as this file loads, before Supabase tidies the address bar.
const hash = typeof window !== "undefined" ? window.location.hash : "";
const OPENED_FROM_RESET_LINK = /[#&]type=recovery\b/.test(hash);
const RESET_LINK_EXPIRED = /error_code=otp_expired|error=access_denied/.test(hash);
// Did the person just delete their account? (The delete screen sends them back here with ?deleted=1.)
const JUST_DELETED = typeof window !== "undefined" && /[?&]deleted=1\b/.test(window.location.search);

type Mode = "signin" | "join" | "forgot";
type Message = { kind: "error" | "ok"; text: string } | null;

const MIN_PASSWORD = 8;

function Field({ id, label, ...rest }: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}

function Notice({ msg }: { msg: Message }) {
  if (!msg) return null;
  return (
    <p className={msg.kind === "error" ? "neg" : "pos"} role={msg.kind === "error" ? "alert" : "status"}>
      {msg.text}
    </p>
  );
}

// Plain links (not the app's own navigation) because these screens are shown before anyone has signed in.
function LegalFooter() {
  return (
    <footer className="legal-footer">
      <p>{NOT_ADVICE}</p>
      <p>
        <a href="/privacy">Privacy policy</a> · <a href="/terms">Terms of use</a>
      </p>
    </footer>
  );
}

// Shown after someone follows a password-reset link: choose a new password.
function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setMsg({ kind: "error", text: `Choose a password of at least ${MIN_PASSWORD} characters.` });
    if (password !== again) return setMsg({ kind: "error", text: "The two passwords don't match." });
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    window.history.replaceState(null, "", window.location.pathname);
    onDone();
  }

  return (
    <main>
      <form className="login" onSubmit={submit}>
        <h1 className="title">New password</h1>
        <p className="muted">Choose a new password for your Daybook account.</p>
        <Field id="new-password" label="New password" type="password" autoComplete="new-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field id="new-password-again" label="New password again" type="password" autoComplete="new-password" required
          value={again} onChange={(e) => setAgain(e.target.value)} />
        <Notice msg={msg} />
        <button className="b-save" type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
      </form>
    </main>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [recovering, setRecovering] = useState(OPENED_FROM_RESET_LINK);
  const [mode, setMode] = useState<Mode>(RESET_LINK_EXPIRED ? "forgot" : "signin");
  const [msg, setMsg] = useState<Message>(
    RESET_LINK_EXPIRED
      ? { kind: "error", text: "That reset link has expired or was already used. Request a new one." }
      : JUST_DELETED
        ? { kind: "ok", text: "Your account and all your data have been deleted." }
        : null
  );
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [emailAgain, setEmailAgain] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (JUST_DELETED) window.history.replaceState(null, "", window.location.pathname);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function go(next: Mode) {
    setMode(next);
    setMsg(null);
    setPassword("");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMsg({ kind: "error", text: error.message });
    setBusy(false);
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/-/g, "").length !== 12) return setMsg({ kind: "error", text: "Enter the full invite code (12 letters and numbers)." });
    if (email.trim().toLowerCase() !== emailAgain.trim().toLowerCase()) {
      return setMsg({ kind: "error", text: "The two email addresses don't match. Check for typos, because your password reset email goes there." });
    }
    if (password.length < MIN_PASSWORD) return setMsg({ kind: "error", text: `Choose a password of at least ${MIN_PASSWORD} characters.` });
    if (!agreed) return setMsg({ kind: "error", text: "Please tick the box to agree to the Terms and Privacy Policy." });
    setBusy(true);
    setMsg(null);
    const problem = await joinWithInvite({ code, email, password });
    if (problem) setMsg({ kind: "error", text: problem });
    setBusy(false);
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    // Same answer whether or not the email has an account, so nobody can use this box to find out who is a member.
    if (error && /rate|too many|seconds/i.test(error.message)) setMsg({ kind: "error", text: "Please wait a minute before asking again." });
    else setMsg({ kind: "ok", text: "If that email has a Daybook account, a link to reset your password is on its way. Check your spam folder too." });
  }

  if (checking) return <p className="soon" role="status">Loading…</p>;
  if (session && recovering) return <NewPasswordForm onDone={() => setRecovering(false)} />;
  if (session) return <>{children}</>;

  return (
    <main>
      {mode === "signin" && (
        <form className="login" onSubmit={signIn}>
          <Logo size={64} />
          <h1 className="title">Daybook</h1>
          <p className="tagline">Your daily trading journal</p>
          <Field id="email" label="Email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field id="password" label="Password" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <Notice msg={msg} />
          <button className="b-save" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <button className="link-btn" type="button" onClick={() => go("forgot")}>Forgot password?</button>
          <button className="link-btn" type="button" onClick={() => go("join")}>Join with an invite code</button>
        </form>
      )}

      {mode === "join" && (
        <form className="login" onSubmit={join}>
          <h1 className="title">Join Daybook</h1>
          <p className="muted">Daybook is invite-only. Ask the person who runs your group for an invite code.</p>
          <Field id="invite-code" label="Invite code" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false}
            placeholder="XXXX-XXXX-XXXX" maxLength={14} required
            value={code} onChange={(e) => setCode(formatCodeInput(e.target.value))} />
          <Field id="join-email" label="Email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field id="join-email-again" label="Email again" type="email" autoComplete="off" required
            value={emailAgain} onChange={(e) => setEmailAgain(e.target.value)} />
          <Field id="join-password" label={`Password (at least ${MIN_PASSWORD} characters)`} type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="check-row">
            <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <label htmlFor="agree">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of use</a> and the{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>, and I understand Daybook is a
              record-keeping tool, not financial advice.
            </label>
          </div>
          <Notice msg={msg} />
          <button className="b-save" type="submit" disabled={busy}>{busy ? "Joining…" : "Join"}</button>
          <button className="link-btn" type="button" onClick={() => go("signin")}>Back to sign in</button>
        </form>
      )}

      {mode === "forgot" && (
        <form className="login" onSubmit={forgot}>
          <h1 className="title">Reset password</h1>
          <p className="muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
          <Field id="forgot-email" label="Email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Notice msg={msg} />
          <button className="b-save" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          <button className="link-btn" type="button" onClick={() => go("signin")}>Back to sign in</button>
        </form>
      )}

      <LegalFooter />
    </main>
  );
}
