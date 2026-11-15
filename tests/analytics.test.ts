import { describe, expect, it } from "vitest";
import {
  barsForPeriod, currentStreak, entriesInPeriod, runningTotal, summarise,
} from "../lib/analytics";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const trades = { "2026-11-09": 41.1, "2026-11-10": -30, "2026-11-11": 10, "2026-11-16": 5 };

describe("entriesInPeriod", () => {
  it("week: only that Monday-to-Friday week", () => {
    expect(entriesInPeriod(trades, "week", d(2026, 11, 12)).map((e) => e.key)).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11",
    ]);
  });

  it("week: includes the Sunday after it, where its commission is paid", () => {
    const commissions = { "2026-11-15": 12 };
    expect(entriesInPeriod(commissions, "week", d(2026, 11, 12)).map((e) => e.key)).toEqual(["2026-11-15"]);
    // ...but not in the following week
    expect(entriesInPeriod(commissions, "week", d(2026, 11, 17))).toEqual([]);
  });

  it("month, year and all", () => {
    expect(entriesInPeriod(trades, "month", d(2026, 11, 12))).toHaveLength(4);
    expect(entriesInPeriod(trades, "month", d(2026, 10, 12))).toHaveLength(0);
    expect(entriesInPeriod(trades, "year", d(2026, 1, 1))).toHaveLength(4);
    expect(entriesInPeriod(trades, "year", d(2025, 1, 1))).toHaveLength(0);
    expect(entriesInPeriod(trades, "all", d(2020, 1, 1))).toHaveLength(4);
  });

  it("returns oldest first", () => {
    const keys = entriesInPeriod({ "2026-11-11": 1, "2026-11-09": 2 }, "month", d(2026, 11, 1)).map((e) => e.key);
    expect(keys).toEqual(["2026-11-09", "2026-11-11"]);
  });
});

describe("summarise", () => {
  it("net, best, worst, average and day count", () => {
    const s = summarise([
      { key: "a", value: 40 },
      { key: "b", value: -10 },
      { key: "c", value: 30 },
    ]);
    expect(s.net).toBe(60);
    expect(s.days).toBe(3);
    expect(s.best?.value).toBe(40);
    expect(s.worst?.value).toBe(-10);
    expect(s.average).toBe(20);
  });

  it("is all zeros when there is nothing", () => {
    expect(summarise([])).toEqual({ net: 0, days: 0, best: null, worst: null, average: 0 });
  });
});

describe("runningTotal", () => {
  it("adds up day by day", () => {
    const r = runningTotal([{ key: "a", value: 10 }, { key: "b", value: -4 }, { key: "c", value: 1 }]);
    expect(r.map((e) => e.value)).toEqual([10, 6, 7]);
    expect(r.map((e) => e.key)).toEqual(["a", "b", "c"]);
  });
});

describe("currentStreak", () => {
  it("counts the latest run of losses", () => {
    expect(currentStreak({ "2026-11-09": 5, "2026-11-10": -1, "2026-11-11": -2 })).toEqual({ kind: "loss", length: 2 });
  });

  it("counts the latest run of wins, and a flat day counts as a win", () => {
    expect(currentStreak({ "2026-11-09": -5, "2026-11-10": 3, "2026-11-11": 0 })).toEqual({ kind: "win", length: 2 });
  });

  it("is null with no trades", () => {
    expect(currentStreak({})).toBeNull();
  });

  it("goes by date, not by the order they were entered", () => {
    expect(currentStreak({ "2026-11-11": -2, "2026-11-09": 5, "2026-11-10": 1 })).toEqual({ kind: "loss", length: 1 });
  });
});

describe("barsForPeriod", () => {
  it("week: one bar per trading day, empty days are null", () => {
    const bars = barsForPeriod(trades, "week", d(2026, 11, 12));
    expect(bars.map((b) => b.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(bars.map((b) => b.value)).toEqual([41.1, -30, 10, null, null]);
  });

  it("month: only weekdays (November 2026 has 21)", () => {
    const bars = barsForPeriod(trades, "month", d(2026, 11, 12));
    expect(bars).toHaveLength(21);
    expect(bars[0].label).toBe("2");
    expect(bars[bars.length - 1].label).toBe("30");
  });

  it("year: twelve months, totals for the months that have trades", () => {
    const bars = barsForPeriod(trades, "year", d(2026, 6, 1));
    expect(bars).toHaveLength(12);
    expect(bars[10].value).toBeCloseTo(26.1, 2); // 41.1 - 30 + 10 + 5
    expect(bars.filter((b) => b.value !== null)).toHaveLength(1);
  });

  it("all: one bar per month that has trades, oldest first", () => {
    const bars = barsForPeriod({ "2026-10-28": 3, "2026-11-09": 4, "2026-11-10": 1 }, "all", d(2026, 11, 1));
    expect(bars.map((b) => b.label)).toEqual(["Oct 26", "Nov 26"]);
    expect(bars.map((b) => b.value)).toEqual([3, 5]);
  });
});
