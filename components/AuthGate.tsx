"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Shows the sign-in screen until you're logged in, then shows the app.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    setBusy(false);
  }

  async function signUp() {
    setBusy(true); setMsg(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
    setBusy(false);
  }

  if (checking) return <p className="soon">Loading…</p>;
  if (session) return <>{children}</>;

  return (
    <form className="login" onSubmit={signIn}>
      <div className="title">Daybook</div>
      <input type="email" placeholder="Email" autoComplete="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password (min 6 characters)" autoComplete="current-password" required
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="neg">{msg}</p>}
      <button className="b-save" type="submit" disabled={busy}>Sign in</button>
      <button className="b-clear" type="button" disabled={busy} onClick={signUp}>Create account</button>
    </form>
  );
}
