"use client";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  return (
    <>
      <div className="title">Settings</div>
      <button className="b-clear signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
      <p className="soon">Accounts and goals are coming soon.</p>
    </>
  );
}
