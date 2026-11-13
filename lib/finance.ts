import { addDays, fromKey, toKey, weekDays } from "./dates";
import type { Commissions, Lots, Trades } from "./store";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Last week's trading profit, for the week before the Sunday `sundayKey`.
export function lastWeekNet(trades: Trades, sundayKey: string): number {
  const prevSunday = addDays(fromKey(sundayKey), -7);
  return weekDays(prevSunday).reduce((s, d) => s + (trades[toKey(d)] ?? 0), 0);
}

// The commission the app fills in: pct% of last week's profit.
// A losing (or flat) week means no commission.
export function suggestedCommission(trades: Trades, sundayKey: string, pct: number): number {
  const net = lastWeekNet(trades, sundayKey);
  return net > 0 ? round2((net * pct) / 100) : 0;
}

// Each day's "real" result: the trade minus any commission paid that day.
export function realDays(trades: Trades, commissions: Commissions): Trades {
  const out: Trades = {};
  for (const k of Object.keys(trades)) out[k] = trades[k];
  for (const k of Object.keys(commissions)) out[k] = (out[k] ?? 0) - commissions[k];
  return out;
}

// The lot size you used on the most recent day before `key` (used to pre-fill the box).
export function lastLotBefore(lots: Lots, key: string): number | undefined {
  let best: string | null = null;
  for (const k of Object.keys(lots)) if (k < key && (best === null || k > best)) best = k;
  return best === null ? undefined : lots[best];
}

// Show a lot size like 0.01 or 0.025 (at least 2 decimals).
export const lotText = (lot: number) =>
  lot.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
