import { addDays, fromKey, isTradingDay } from "./dates";

// Monthly profit target: how far along you are, and how many trading days are left.
// Trading days are Monday to Friday. Bank holidays are not taken off.

// How many Monday-to-Friday days there are from `from` to `to`, counting both ends.
export function countTradingDays(from: Date, to: Date): number {
  let count = 0;
  for (let d = addDays(from, 0); d <= to; d = addDays(d, 1)) if (isTradingDay(d)) count++;
  return count;
}

export type TargetPhase = "past" | "current" | "future";
// reached   = you have hit the target
// onTrack   = not there yet, but at or above the pace needed
// behind    = below the pace needed (still possible to catch up)
// missed    = the month is over (or has no trading days left) and you did not get there
// notStarted = the month has not begun
export type TargetStatus = "reached" | "onTrack" | "behind" | "missed" | "notStarted";

export type TargetProgress = {
  target: number;
  net: number;
  pct: number;            // how much of the target is done, 0 or more (can go over 100)
  remaining: number;      // what is still needed, never below 0
  daysLeft: number;       // trading days left, counting today if you have not logged it yet
  totalDays: number;      // trading days in the whole month
  perDay: number | null;  // needed per remaining trading day, or null when it does not apply
  phase: TargetPhase;
  status: TargetStatus;
};

export function monthTargetProgress(opts: {
  target: number;       // must be above 0
  net: number;          // this month's profit after commission
  year: number;
  month: number;        // 0 = January ... 11 = December
  today: Date;
  todayLogged: boolean; // has today's result already been entered?
}): TargetProgress {
  const { target, net, year, month, todayLogged } = opts;
  const today = new Date(opts.today.getFullYear(), opts.today.getMonth(), opts.today.getDate());
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const phase: TargetPhase = today > monthEnd ? "past" : today < monthStart ? "future" : "current";
  const totalDays = countTradingDays(monthStart, monthEnd);

  let daysLeft = 0;
  if (phase === "future") daysLeft = totalDays;
  else if (phase === "current") {
    // Today still counts as a day to trade in, until you have logged it.
    const from = isTradingDay(today) && !todayLogged ? today : addDays(today, 1);
    daysLeft = from > monthEnd ? 0 : countTradingDays(from, monthEnd);
  }

  const reached = net >= target;
  const remaining = Math.max(0, target - net);
  const pct = Math.max(0, (net / target) * 100);
  const perDay = !reached && daysLeft > 0 ? remaining / daysLeft : null;

  let status: TargetStatus;
  if (reached) status = "reached";
  else if (phase === "future") status = "notStarted";
  else if (phase === "past" || daysLeft === 0) status = "missed";
  else {
    // Pace: by now you should have done this share of the target.
    const elapsed = totalDays - daysLeft;
    status = net >= (target * elapsed) / totalDays ? "onTrack" : "behind";
  }

  return { target, net, pct, remaining, daysLeft, totalDays, perDay, phase, status };
}

// Points for the Running Total graph when a target is set (Month view).
// x is how far through the month's trading days you are, from 0 (start) to 1 (last trading day);
// y is your running total. It always starts at 0 so the line begins at the left edge.
// A Saturday or Sunday (such as the Sunday commission) sits at the same x as the Friday before it,
// and when two points share an x the later one wins, so x always moves forward.
export type PacePoint = { x: number; y: number };

export function pacePoints(running: { key: string; value: number }[], year: number, month: number): PacePoint[] {
  const start = new Date(year, month, 1);
  const total = countTradingDays(start, new Date(year, month + 1, 0));
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const byX = new Map<number, number>();
  byX.set(0, 0);
  for (const r of running) {
    if (!r.key.startsWith(prefix)) continue;
    byX.set(countTradingDays(start, fromKey(r.key)) / total, r.value);
  }
  return [...byX.entries()].sort((a, b) => a[0] - b[0]).map(([x, y]) => ({ x, y }));
}

// ---- Celebrating a hit target ----
// Profit after commission for one calendar month (month 0 = January): trades in that month minus the
// commission paid in it. This is the same figure as the Total P&L on the Month view.
export function monthNet(
  trades: Record<string, number>, commissions: Record<string, number>, year: number, month: number
): number {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const sum = (m: Record<string, number>) => Object.entries(m).reduce((s, [k, v]) => (k.startsWith(prefix) ? s + v : s), 0);
  return sum(trades) - sum(commissions);
}

// The name a month's celebration is remembered under on this device, so each month is celebrated once.
export const celebrationKey = (year: number, month: number): string =>
  `daybook-celebrated-${year}-${String(month + 1).padStart(2, "0")}`;

// Celebrate when a target is set, this month's profit has reached it, and we have not celebrated this month yet.
export const shouldCelebrate = (net: number, target: number | null, alreadyDone: boolean): boolean =>
  target !== null && target > 0 && net >= target && !alreadyDone;
