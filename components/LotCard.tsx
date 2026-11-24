"use client";
import { accountBalance } from "@/lib/capital";
import { toKey } from "@/lib/dates";
import { lastLot, recentAverage } from "@/lib/lots";
import { useData } from "./DataProvider";
import LotView from "./LotView";
import { usePrivacy } from "./Privacy";

// The lot size your account supports, from your balance (everything in the account: own money + bonus + profit - withdrawals).
export default function LotCard() {
  const { trades, commissions, lots, capital } = useData();
  const { hidden } = usePrivacy();
  const today = new Date();
  const balance = accountBalance(capital, trades, commissions);
  return (
    <LotView
      balance={balance}
      avg={recentAverage(trades, commissions, 20)}
      last={lastLot(lots)}
      today={today}
      todayLogged={trades[toKey(today)] !== undefined}
      hidden={hidden}
    />
  );
}
