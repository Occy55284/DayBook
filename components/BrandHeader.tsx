"use client";
import Image from "next/image";
import { usePrivacy } from "./Privacy";

// The Daybook logo and name, shown at the top of every signed-in screen, with the Privacy switch.
export default function BrandHeader() {
  const { hidden, toggle } = usePrivacy();
  return (
    <header className="brand">
      <Image src="/logo-mark.png" alt="" width={52} height={52} priority />
      <span className="brand-name">
        Day<span>book</span>
      </span>
      <button
        type="button"
        className={`privacy-btn ${hidden ? "on" : ""}`}
        aria-pressed={hidden}
        aria-label={hidden ? "Privacy mode is on. Show amounts." : "Privacy mode is off. Hide all amounts."}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {hidden
            ? (<><path d="M3 3l18 18" /><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>)
            : (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>)}
        </svg>
        <span>{hidden ? "Private" : "Privacy"}</span>
      </button>
    </header>
  );
}
