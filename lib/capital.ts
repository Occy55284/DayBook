import { allTimeNet } from "./finance";
import type { CapitalEntry, CapitalKind, Commissions, Trades } from "./store";

export const CAPITAL_LABELS: Record<CapitalKind, string> = {
  start: "Starting balance",
  deposit: "Own money added",
  bonus: "Bonus",
  withdrawal: "Withdrawal",
};

export type CapitalSummary = {
  ownMoney: number;   // starting balance + own money added: what you put in yourself
  bonus: number;      // introduction bonuses
  withdrawn: number;  // money taken out
  balance: number;    // what the account holds: money in + bonus + profit - withdrawals
  pctOwn: number | null;       // profit as a % of your own money (null when there is none)
  pctWithBonus: number | null; // profit as a % of own money + bonus (null when there is none)
};

// `net` is your all-time profit after commission.
// The % is profit divided by the money put in. Withdrawals do NOT shrink that base,
// so taking profit out does not make the % look better; they only lower the balance.
export function capitalSummary(entries: CapitalEntry[], net: number): CapitalSummary {
  const total = (kind: CapitalKind) => entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0);
  const ownMoney = total("start") + total("deposit");
  const bonus = total("bonus");
  const withdrawn = total("withdrawal");
  return {
    ownMoney,
    bonus,
    withdrawn,
    balance: ownMoney + bonus + net - withdrawn,
    pctOwn: ownMoney > 0 ? (net / ownMoney) * 100 : null,
    pctWithBonus: ownMoney + bonus > 0 ? (net / (ownMoney + bonus)) * 100 : null,
  };
}

// Show a percentage like +24.5% or -3.2%.
export const pctText = (n: number): string =>
  `${n < 0 ? "-" : "+"}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// The total value of the account: own money + bonus + everything made (after commission) - withdrawals.
// null until some capital has been entered, because without a starting balance the total is unknown.
export function accountBalance(entries: CapitalEntry[], trades: Trades, commissions: Commissions): number | null {
  return entries.length === 0 ? null : capitalSummary(entries, allTimeNet(trades, commissions)).balance;
}
