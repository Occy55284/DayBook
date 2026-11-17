import { addDays, isTradingDay } from "./dates";

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
