"use client";
import DeleteAccount from "@/components/DeleteAccount";
import InviteAdmin from "@/components/InviteAdmin";
import SettingsForm from "@/components/SettingsForm";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  return (
    <>
      <h1 className="title">Settings</h1>
      <SettingsForm />
      <InviteAdmin />
      <button className="b-clear signout" onClick={() => supabase.auth.signOut()} style={{ marginBottom: 16 }}>Sign out</button>
      <DeleteAccount />
      <p className="soon">Accounts and goals are coming soon.</p>
    </>
  );
}
