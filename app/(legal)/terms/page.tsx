import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LEGAL_UPDATED, NOT_ADVICE, OWNER_NAME } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of use · Daybook" };

export default function Terms() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>

      <p>
        These are the rules for using Daybook. By joining or using it, you agree to them and to the{" "}
        <Link href="/privacy">Privacy policy</Link>. If you don&rsquo;t agree, please don&rsquo;t use Daybook.
      </p>

      <div className="legal-callout" role="note">
        <strong>Important:</strong> {NOT_ADVICE} Trading and copy trading carry a real risk of losing money.
      </div>

      <h2>Who runs it</h2>
      <p>
        Daybook is a personal side project run by {OWNER_NAME}, not a company. You can reach me at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What Daybook does, and doesn&rsquo;t</h2>
      <ul>
        <li>It is a journal. It shows totals and charts from the numbers <strong>you</strong> type in.</li>
        <li>It does not give financial, investment, tax or legal advice, and nothing in it is a recommendation to trade or to copy anyone.</li>
        <li>It does not connect to your broker or trading account, and it does not place trades.</li>
        <li>
          Its sums, including the suggested Sunday commission, are a convenience. Your broker&rsquo;s own statements are the
          official record. Please check them, and change any number that doesn&rsquo;t match.
        </li>
        <li>Lot sizes are shown for reference only and are never used in any calculation.</li>
      </ul>

      <h2>Who can use it</h2>
      <ul>
        <li>You must be 18 or over, and you need an invite code.</li>
        <li>One account per person. Keep your password to yourself.</li>
        <li>Invite codes are for the person they were made for. Please don&rsquo;t sell or pass them around.</li>
      </ul>

      <h2>Using it properly</h2>
      <p>Please don&rsquo;t:</p>
      <ul>
        <li>try to see or change anyone else&rsquo;s information, or get around the sign-in or invite system;</li>
        <li>overload, attack or interfere with the service, or use automated tools to guess codes or passwords;</li>
        <li>use it for anything unlawful.</li>
      </ul>
      <p>I may suspend or remove an account that breaks these rules.</p>

      <h2>Your information</h2>
      <p>
        The numbers you enter are yours. You can download them or delete your account at any time in Settings. How
        your information is handled is explained in the <Link href="/privacy">Privacy policy</Link>.
      </p>

      <h2>Free, and as it is</h2>
      <p>
        Daybook is free to use for now. It is provided &ldquo;as is&rdquo;: I work to keep it running and accurate, but I
        can&rsquo;t promise it will always be available, error-free or never lose data. Keep your own copy of anything
        important (the download button in Settings is there for that). I may change, pause or stop Daybook, and where I
        can I will give notice. If it ever becomes paid, nothing will be charged without your clear agreement first.
      </p>

      <h2>Responsibility</h2>
      <p>
        Nothing in these terms limits anything the law doesn&rsquo;t allow to be limited, such as responsibility for fraud
        or for death or personal injury caused by negligence. Apart from that, and as far as the law allows, I am not
        responsible for any losses that come from using Daybook, including trading decisions you make, mistakes or gaps in
        its figures, or lost data. You use it, and make your own decisions, at your own risk.
      </p>

      <h2>Changes</h2>
      <p>
        I may update these terms. If a change matters, I will update the date above and let members know in the app.
        Carrying on using Daybook after that means you accept the new version.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the law of England and Wales.</p>

      <h2>Contact</h2>
      <p>
        {OWNER_NAME}, <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
