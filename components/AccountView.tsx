"use client";
import Link from "next/link";
import { useFmt } from "./Privacy";

// The total value of the account, shown under the logo on every signed-in screen.
// `balance` is null until some capital has been entered; then a small link explains how to get the number.
// In privacy mode the amount is dots.
export default function AccountView({ balance }: { balance: number | null }) {
  const { money } = useFmt();
  if (balance === null) {
    return (
      <Link href="/analytics" className="account-strip account-prompt">
        Add your starting balance to see your account value <span aria-hidden="true">›</span>
      </Link>
    );
  }
  return (
    <div className="account-strip" role="group" aria-label="Account value">
      <span className="label">Account value</span>
      <span className={`account-val ${balance < 0 ? "neg" : ""}`}>{money(balance)}</span>
    </div>
  );
}
