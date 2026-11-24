"use client";
import { capitalSummary } from "@/lib/capital";
import { toKey } from "@/lib/dates";
import { allTimeNet } from "@/lib/finance";
import { lastLot, recentAverage } from "@/lib/lots";
import { useData } from "./DataProvider";
import LotView from "./LotView";
import { usePrivacy } from "./Privacy";

// The lot size your account supports, from your balance (everything in the account: own money + bonus + profit - withdrawals).
export default function LotCard() {
  const { trades, commissions, lots, capital } = useData();
  const { hidden } = usePrivacy();
  const today = new Date();
  const balance = capital.length === 0 ? null : capitalSummary(capital, allTimeNet(trades, commissions)).balance;
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
