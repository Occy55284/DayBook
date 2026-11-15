import Link from "next/link";

// Privacy policy and terms: open to everyone, no sign-in needed.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="legal">
      <nav className="legal-nav" aria-label="Legal pages">
        <Link href="/">← Back to Daybook</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/terms">Terms</Link>
      </nav>
      {children}
    </main>
  );
}
