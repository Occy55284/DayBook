"use client";
import SettingsForm from "@/components/SettingsForm";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  return (
    <>
      <h1 className="title">Settings</h1>
      <SettingsForm />
      <button className="b-clear signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
      <p className="soon">Accounts and goals are coming soon.</p>
    </>
  );
}
