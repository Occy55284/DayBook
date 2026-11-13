import { commissionSunday, monthName, toKey, weekDays, weekStart } from "./dates";
import type { Trades } from "./store";

export type Period = "week" | "month" | "year" | "all";
export type Entry = { key: string; value: number };

// All logged days that fall inside the chosen period, oldest first.
export function entriesInPeriod(trades: Trades, mode: Period, anchor: Date): Entry[] {
  const year = anchor.getFullYear();
  const month = String(anchor.getMonth() + 1).padStart(2, "0");
  // The week's five trading days, plus the Sunday after it (when its commission is paid).
  const monday = weekStart(anchor);
  const weekKeys = new Set([...weekDays(monday), commissionSunday(monday)].map(toKey));

  const inPeriod = (key: string) =>
    mode === "week" ? weekKeys.has(key)
    : mode === "month" ? key.startsWith(`${year}-${month}`)
    : mode === "year" ? key.startsWith(`${year}-`)
    : true;

  return Object.entries(trades)
    .filter(([key]) => inPeriod(key))
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export type Summary = {
  net: number;
  days: number;
  best: Entry | null;
  worst: Entry | null;
  average: number;
};

export function summarise(entries: Entry[]): Summary {
  if (entries.length === 0) return { net: 0, days: 0, best: null, worst: null, average: 0 };
  const net = entries.reduce((s, e) => s + e.value, 0);
  const best = entries.reduce((a, b) => (b.value > a.value ? b : a));
  const worst = entries.reduce((a, b) => (b.value < a.value ? b : a));
  return { net, days: entries.length, best, worst, average: net / entries.length };
}

// Running total: after each logged day, how much you are up or down overall.
export function runningTotal(entries: Entry[]): Entry[] {
  let total = 0;
  return entries.map((e) => {
    total += e.value;
    return { key: e.key, value: total };
  });
}

// Current streak across ALL logged days: e.g. { kind: "win", length: 3 }.
// A day of exactly 0 counts as a win, the same as the calendar colours it.
export function currentStreak(trades: Trades): { kind: "win" | "loss"; length: number } | null {
  const keys = Object.keys(trades).sort();
  if (keys.length === 0) return null;
  const isWin = (k: string) => trades[k] >= 0;
  const kind = isWin(keys[keys.length - 1]) ? "win" : "loss";
  let length = 0;
  for (let i = keys.length - 1; i >= 0 && isWin(keys[i]) === (kind === "win"); i--) length++;
  return { kind, length };
}

export type Bar = { label: string; value: number | null };

// Bars for the profit/loss chart.
// Week / Month: one bar per trading day. Year / All: one bar per month.
export function barsForPeriod(trades: Trades, mode: Period, anchor: Date): Bar[] {
  if (mode === "week") {
    return weekDays(weekStart(anchor)).map((d) => ({
      label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      value: trades[toKey(d)] ?? null,
    }));
  }

  if (mode === "month") {
    const bars: Bar[] = [];
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const d = new Date(y, m, day);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // no weekend trading
      bars.push({ label: String(day), value: trades[toKey(d)] ?? null });
    }
    return bars;
  }

  // Year and All: add up each month.
  const monthTotals: Record<string, number> = {};
  Object.entries(trades).forEach(([key, v]) => {
    const ym = key.slice(0, 7);
    if (mode === "year" && !ym.startsWith(`${anchor.getFullYear()}-`)) return;
    monthTotals[ym] = (monthTotals[ym] ?? 0) + v;
  });

  if (mode === "year") {
    return Array.from({ length: 12 }, (_, m) => {
      const ym = `${anchor.getFullYear()}-${String(m + 1).padStart(2, "0")}`;
      return { label: monthName(m).slice(0, 1), value: monthTotals[ym] ?? null };
    });
  }

  return Object.keys(monthTotals).sort().map((ym) => {
    const [y, m] = ym.split("-").map(Number);
    return { label: `${monthName(m - 1).slice(0, 3)} ${String(y).slice(2)}`, value: monthTotals[ym] };
  });
}
