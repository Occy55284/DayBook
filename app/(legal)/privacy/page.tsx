import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LEGAL_UPDATED, OWNER_NAME } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy · Daybook" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>

      <p>
        This explains what information Daybook keeps about you, why, who else handles it, and what you can do about it.
        I&rsquo;ve tried to keep it in plain English. Please also read the <Link href="/terms">Terms</Link>.
      </p>

      <h2>Who is responsible for your information</h2>
      <p>
        Daybook is a personal side project run by me, {OWNER_NAME}. It is not a company. I decide how your information is
        used, which makes me the &ldquo;data controller&rdquo; under UK data protection law. You can contact me at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What Daybook is</h2>
      <p>
        A private journal where you type in each trading day&rsquo;s profit or loss, the lot size you traded and the
        commission your broker takes. It shows your totals and charts. It does <strong>not</strong> connect to your
        broker, see your trading account or place trades.
      </p>

      <h2>What information is kept</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your email address and your password. Your password is stored only in scrambled
          form by the login service, so I can&rsquo;t read it. Also when your account was made and when you last signed in.
        </li>
        <li>
          <strong>What you enter:</strong> daily profit and loss amounts, lot sizes, Sunday commission amounts, your
          commission percentage, your monthly profit target, and any money you record going into or out of the account
          (starting balance, deposits, bonuses and withdrawals, with an optional short note).
        </li>
        <li>
          <strong>Your invite:</strong> if you joined with an invite code, the code, when it was used, and any note the
          person who invited you wrote about it (for example your name).
        </li>
        <li>
          <strong>Your agreement:</strong> which version of the Terms and this policy you agreed to, and when.
        </li>
        <li>
          <strong>Technical records:</strong> the companies that run Daybook (below) keep normal technical logs, such as your
          IP address, browser type and the time of requests, to keep the service running and secure.
        </li>
        <li>
          <strong>On your device:</strong> a small piece of sign-in information stored in your browser so you stay signed
          in. It is needed for the app to work. Daybook has no advertising, no analytics and no tracking cookies.
        </li>
      </ul>
      <p>
        Daybook does not ask for your bank, card or broker details, and I don&rsquo;t sell your information or use it for
        advertising.
      </p>

      <h2>Why it is used</h2>
      <ul>
        <li>To provide the journal you asked for: showing your entries, totals and charts to you (it is needed to do what you signed up for).</li>
        <li>To keep Daybook secure and prevent misuse, such as guessing invite codes or passwords (my legitimate interest in running a safe service).</li>
        <li>To keep a record that you agreed to the Terms and this policy.</li>
      </ul>

      <h2>Who can see your entries</h2>
      <p>
        Only you, when you are signed in. Each person&rsquo;s entries are locked to their own account, and other members
        can&rsquo;t see them. As the person who runs Daybook I can technically reach the database. I will only look at
        your records if I need to fix a problem, or if the law requires it.
      </p>

      <h2>Companies that handle information for Daybook</h2>
      <ul>
        <li><strong>Supabase</strong> runs the database, sign-in and the small server programs behind Daybook. Your data is stored in its London region.</li>
        <li><strong>Vercel</strong> hosts the website itself.</li>
        <li>
          <strong>Email:</strong> if you ask to reset your password, an email is sent through the email service connected to
          Daybook&rsquo;s login system. I will update this page if that changes.
        </li>
      </ul>
      <p>
        These companies only handle information to provide their service to Daybook. Some of their technical processing
        (such as logs) may take place outside the UK, using the safeguards those companies put in place for such
        transfers.
      </p>

      <h2>How long it is kept</h2>
      <p>
        For as long as you have an account. When you delete your account (Settings, then <em>Delete my account</em>), your
        login and all your entries are removed from the live database straight away. An invite-code record stays, but it
        no longer points at you. Copies held in the database company&rsquo;s backups, and technical logs, are removed when
        those expire under that company&rsquo;s own schedule.
      </p>

      <h2>Your rights</h2>
      <p>Under UK data protection law you can ask to:</p>
      <ul>
        <li>see the information held about you;</li>
        <li>have anything wrong corrected;</li>
        <li>have your information deleted;</li>
        <li>restrict or object to how it is used;</li>
        <li>take a copy to use elsewhere.</li>
      </ul>
      <p>
        Two of these you can do yourself in Settings: <em>Download my data</em> gives you everything you entered as a
        spreadsheet file, and <em>Delete my account</em> deletes it all. For anything else, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and I&rsquo;ll reply within one month. If you&rsquo;re unhappy
        with how I&rsquo;ve handled your information, you can complain to the Information Commissioner&rsquo;s Office at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Daybook uses encrypted connections, scrambled passwords, invite-only sign-up and per-person locking of entries. No
        online service is perfectly secure. If something goes wrong that is likely to put you at risk, I will tell you and,
        where required, the regulator.
      </p>

      <h2>Age</h2>
      <p>Daybook is for people aged 18 or over.</p>

      <h2>Changes</h2>
      <p>
        If I change this policy in a way that matters, I will update the date at the top and let members know in the app.
      </p>

      <h2>Contact</h2>
      <p>
        {OWNER_NAME}, <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
