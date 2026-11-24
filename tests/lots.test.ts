import { describe, expect, it } from "vitest";
import { allTimeNet } from "../lib/finance";
import { countdown, isOverLot, lastLot, lotStep, nthTradingDay, recentAverage } from "../lib/lots";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("lotStep: 0.01 lots for every £1,000, whole steps only", () => {
  it("gives the lot your balance supports", () => {
    expect(lotStep(1000).lot).toBe(0.01);
    expect(lotStep(1500).lot).toBe(0.01);
    expect(lotStep(2000).lot).toBe(0.02);
    expect(lotStep(2500).lot).toBe(0.02);       // never rounds up to 0.025
    expect(lotStep(12345).lot).toBe(0.12);
  });

  it("£2,999.99 is still 0.02, and £3,000 is 0.03 (no floating-point surprises)", () => {
    expect(lotStep(2999.99).lot).toBe(0.02);
    expect(lotStep(3000).lot).toBe(0.03);
    expect(lotStep(2999.995).lot).toBe(0.03);   // rounds to £3,000.00 in whole pence
    expect(lotStep(0.1 + 0.2 + 2999.7).lot).toBe(0.03);
  });

  it("below £1,000 the rule gives no lot yet, and a negative balance is treated as nothing", () => {
    expect(lotStep(999.99).lot).toBe(0);
    expect(lotStep(0).lot).toBe(0);
    expect(lotStep(-250).lot).toBe(0);
    expect(lotStep(-250).toGo).toBe(1000);
  });

  it("says how far the next step is and how far through this one you are", () => {
    const s = lotStep(2150);
    expect(s.nextLot).toBe(0.03);
    expect(s.nextAt).toBe(3000);
    expect(s.toGo).toBe(850);
    expect(s.progress).toBeCloseTo(0.15, 10);
    expect(lotStep(3000).toGo).toBe(1000);       // exactly on a step: a whole new step to climb
    expect(lotStep(3000).progress).toBe(0);
  });
});

describe("recentAverage", () => {
  it("is null with nothing logged", () => {
    expect(recentAverage({}, {})).toBeNull();
  });
  it("averages the last 20 logged days, after the commission paid inside that window", () => {
    const trades: Record<string, number> = {};
    for (let i = 1; i <= 25; i++) trades[`2026-10-${String(i).padStart(2, "0")}`] = 10;   // 25 days of £10
    trades["2026-10-25"] = 110;                                                           // the last day is £110
    const a = recentAverage(trades, {})!;
    expect(a.days).toBe(20);
    expect(a.perDay).toBeCloseTo((19 * 10 + 110) / 20, 10);                               // days 6..25
    const withComm = recentAverage(trades, { "2026-10-12": 30, "2026-10-02": 999 })!;     // the 2nd is before the window
    expect(withComm.perDay).toBeCloseTo((19 * 10 + 110 - 30) / 20, 10);
  });
  it("uses what there is when fewer than 20 days are logged, and counts losses", () => {
    const a = recentAverage({ "2026-11-02": 50, "2026-11-03": -20 }, {})!;
    expect(a.days).toBe(2);
    expect(a.perDay).toBe(15);
  });
});

describe("nthTradingDay", () => {
  it("counts the start day when it is a trading day", () => {
    expect(nthTradingDay(d(2026, 11, 17), 1)).toEqual(d(2026, 11, 17));   // Tue
    expect(nthTradingDay(d(2026, 11, 17), 3)).toEqual(d(2026, 11, 19));   // Thu
  });
  it("skips weekends", () => {
    expect(nthTradingDay(d(2026, 11, 20), 2)).toEqual(d(2026, 11, 23));   // Fri, then Mon
    expect(nthTradingDay(d(2026, 11, 21), 1)).toEqual(d(2026, 11, 23));   // Saturday start: first trading day is Monday
    expect(nthTradingDay(d(2026, 11, 16), 10)).toEqual(d(2026, 11, 27));  // two full weeks
  });
});

describe("countdown", () => {
  const avg = { perDay: 35, days: 20 };
  it("says how many trading days at the recent average, and roughly when", () => {
    const c = countdown(850, avg, d(2026, 11, 17), true);                  // Tue, today already logged
    expect(c.kind).toBe("eta");
    if (c.kind === "eta") {
      expect(c.days).toBe(25);                                             // 850 / 35 = 24.3 -> 25
      expect(c.perDay).toBe(35);
      expect(c.basedOn).toBe(20);
      expect(c.date).toEqual(nthTradingDay(d(2026, 11, 18), 25));          // starts counting tomorrow
    }
  });
  it("counts today as a day to trade in until it is logged", () => {
    const logged = countdown(70, avg, d(2026, 11, 17), true);
    const open = countdown(70, avg, d(2026, 11, 17), false);
    if (logged.kind === "eta" && open.kind === "eta") {
      expect(logged.days).toBe(2);
      expect(open.days).toBe(2);
      expect(open.date).toEqual(d(2026, 11, 18));                          // today + tomorrow
      expect(logged.date).toEqual(d(2026, 11, 19));                        // tomorrow + the day after
    } else throw new Error("expected an estimate");
  });
  it("exactly enough is one day, never zero", () => {
    const c = countdown(35, avg, d(2026, 11, 17), true);
    expect(c.kind === "eta" && c.days).toBe(1);
  });
  it("no logged days, or an average that is not above zero, gives no estimate", () => {
    expect(countdown(500, null, d(2026, 11, 17), false)).toEqual({ kind: "none" });
    expect(countdown(500, { perDay: 0, days: 5 }, d(2026, 11, 17), false)).toEqual({ kind: "flat" });
    expect(countdown(500, { perDay: -12, days: 5 }, d(2026, 11, 17), false)).toEqual({ kind: "flat" });
  });
});

describe("lastLot and isOverLot", () => {
  it("finds the most recent day that has a lot", () => {
    expect(lastLot({})).toBeNull();
    expect(lastLot({ "2026-11-03": 0.02, "2026-11-17": 0.03, "2026-11-09": 0.01 })).toEqual({ key: "2026-11-17", lot: 0.03 });
  });
  it("flags only a lot above what the balance supports", () => {
    expect(isOverLot(0.03, 0.02)).toBe(true);
    expect(isOverLot(0.02, 0.02)).toBe(false);
    expect(isOverLot(0.01, 0.02)).toBe(false);
    expect(isOverLot(0.01, 0)).toBe(true);          // under £1,000: even 0.01 is above the rule
    expect(isOverLot(0.1 + 0.2 - 0.2, 0.1)).toBe(false); // float noise does not count
  });
});

describe("allTimeNet", () => {
  it("is trades minus commission, all time", () => {
    expect(allTimeNet({ "2026-11-02": 100, "2026-11-03": -20 }, { "2026-11-08": 24 })).toBe(56);
    expect(allTimeNet({}, {})).toBe(0);
  });
});
