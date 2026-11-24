import { addDays, isTradingDay } from "./dates";
import type { Commissions, Lots, Trades } from "./store";

// Lot size rule: 0.01 lots for every £1,000 in the account.
// Whole steps only, so £2,999.99 is still 0.02 and you reach 0.03 at £3,000. Never rounds up.
export const BALANCE_PER_STEP = 1000;
export const LOT_STEP = 0.01;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type LotStep = {
  lot: number;       // the lot size your balance supports now (0 until the account reaches £1,000)
  nextLot: number;   // the lot size at the next step
  nextAt: number;    // the balance where the next step starts
  toGo: number;      // £ still needed to reach it (always above 0)
  progress: number;  // 0 to 1: how far through the current £1,000 step you are
};

export function lotStep(balance: number): LotStep {
  const cents = Math.round(Math.max(0, balance) * 100); // work in whole pence so £2,999.99 can never tip over
  const stepCents = BALANCE_PER_STEP * 100;
  const steps = Math.floor(cents / stepCents);
  const nextAt = (steps + 1) * BALANCE_PER_STEP;
  return {
    lot: round2(steps * LOT_STEP),
    nextLot: round2((steps + 1) * LOT_STEP),
    nextAt,
    toGo: (nextAt * 100 - cents) / 100,
    progress: (cents - steps * stepCents) / stepCents,
  };
}

// How much you have grown per trading day lately, after commission, over your last `n` logged trading days.
// Commission counts for the weeks inside that window. Returns null when no day has been logged.
export type RecentAverage = { perDay: number; days: number };
export function recentAverage(trades: Trades, commissions: Commissions, n = 20): RecentAverage | null {
  const keys = Object.keys(trades).sort();
  if (keys.length === 0) return null;
  const window = keys.slice(-n);
  const first = window[0];
  const last = window[window.length - 1];
  const made = window.reduce((s, k) => s + trades[k], 0);
  const paid = Object.entries(commissions).reduce((s, [k, v]) => (k >= first && k <= last ? s + v : s), 0);
  return { perDay: (made - paid) / window.length, days: window.length };
}

// The date of the n-th trading day (Monday to Friday) counting from `start`, which counts as day 1 if it is one.
export function nthTradingDay(start: Date, n: number): Date {
  let d = addDays(start, 0);
  let count = 0;
  for (let guard = 0; guard < 4000; guard++) {
    if (isTradingDay(d) && ++count >= Math.max(1, n)) return d;
    d = addDays(d, 1);
  }
  return d;
}

export type Countdown =
  | { kind: "none" }                                                                  // no days logged yet
  | { kind: "flat" }                                                                  // the recent average is not above zero
  | { kind: "eta"; days: number; date: Date; perDay: number; basedOn: number };       // about `days` trading days, around `date`

// When could you move up a step? `toGo` pounds at the recent average per trading day.
// Today counts as a day to trade in until you have logged it (the same rule as the monthly target countdown).
export function countdown(toGo: number, avg: RecentAverage | null, today: Date, todayLogged: boolean): Countdown {
  if (!avg) return { kind: "none" };
  if (!(avg.perDay > 0)) return { kind: "flat" };
  const days = Math.max(1, Math.ceil(toGo / avg.perDay - 1e-9));
  const start = isTradingDay(today) && !todayLogged ? today : addDays(today, 1);
  return { kind: "eta", days, date: nthTradingDay(start, days), perDay: avg.perDay, basedOn: avg.days };
}

// The lot size on your most recent day that has one.
export function lastLot(lots: Lots): { key: string; lot: number } | null {
  const keys = Object.keys(lots).sort();
  if (keys.length === 0) return null;
  const key = keys[keys.length - 1];
  return { key, lot: lots[key] };
}

// Is the lot size you traded above what your balance supports?
export const isOverLot = (traded: number, recommended: number): boolean => round2(traded) > round2(recommended);
