"use client";
import { accountBalance } from "@/lib/capital";
import AccountView from "./AccountView";
import { useData } from "./DataProvider";

// What the whole account is worth right now: own money + bonus + profit after commission - withdrawals.
export default function AccountStrip() {
  const { trades, commissions, capital, ready, failed } = useData();
  if (!ready || failed) return null; // wait for the real numbers rather than flash a wrong total
  return <AccountView balance={accountBalance(capital, trades, commissions)} />;
}
