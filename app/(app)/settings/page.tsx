"use client";
import Link from "next/link";
import DeleteAccount from "@/components/DeleteAccount";
import InviteAdmin from "@/components/InviteAdmin";
import SettingsForm from "@/components/SettingsForm";
import { CONTACT_EMAIL, LEGAL_UPDATED, NOT_ADVICE } from "@/lib/legal";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  return (
    <>
      <h1 className="title">Settings</h1>
      <SettingsForm />
      <InviteAdmin />
      <button className="b-clear signout" onClick={() => supabase.auth.signOut()} style={{ marginBottom: 16 }}>Sign out</button>
      <DeleteAccount />

      <section className="card about" style={{ marginBottom: 16 }} aria-labelledby="about-title">
        <h2 id="about-title" className="label" style={{ margin: 0 }}>About Daybook</h2>
        <p className="amount-hint muted" style={{ marginTop: 6 }}>{NOT_ADVICE}</p>
        <p className="amount-hint">
          <Link href="/privacy">Privacy policy</Link> · <Link href="/terms">Terms of use</Link>
        </p>
        <p className="amount-hint muted">
          Questions about your information? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Legal pages last
          updated {LEGAL_UPDATED}.
        </p>
      </section>

      <p className="soon">Accounts and goals are coming soon.</p>
    </>
  );
}
