import { describe, expect, it } from "vitest";
import { lastLotBefore, lotText, realDays, suggestedCommission, weekNetBeforeSunday } from "../lib/finance";

// A normal profitable week, Monday 9 to Friday 13 November 2026.
const week = {
  "2026-11-09": 41.1,
  "2026-11-10": 25.69,
  "2026-11-11": 31.33,
  "2026-11-12": 28.55,
  "2026-11-13": 6.3,
};

describe("weekly profit before a Sunday", () => {
  it("adds up Monday to Friday of the week before that Sunday", () => {
    expect(weekNetBeforeSunday(week, "2026-11-15")).toBeCloseTo(132.97, 2);
  });

  it("ignores trades in other weeks and on the Sunday itself", () => {
    const messy = { ...week, "2026-11-08": 99, "2026-11-16": 500, "2026-11-15": 7 };
    expect(weekNetBeforeSunday(messy, "2026-11-15")).toBeCloseTo(132.97, 2);
  });

  it("counts a week with no trades as zero", () => {
    expect(weekNetBeforeSunday({}, "2026-11-15")).toBe(0);
  });
});

describe("suggested commission", () => {
  it("is 30% of the week's profit, to the penny", () => {
    expect(suggestedCommission(week, "2026-11-15", 30)).toBe(39.89); // 132.97 x 30%
  });

  it("uses the percentage you give it", () => {
    expect(suggestedCommission({ "2026-11-09": 100 }, "2026-11-15", 35)).toBe(35);
  });

  it("is nothing after a losing week", () => {
    expect(suggestedCommission({ "2026-11-09": -10, "2026-11-10": 5 }, "2026-11-15", 30)).toBe(0);
  });

  it("is nothing after a flat week or an empty one", () => {
    expect(suggestedCommission({ "2026-11-09": 0 }, "2026-11-15", 30)).toBe(0);
    expect(suggestedCommission({}, "2026-11-15", 30)).toBe(0);
  });

  it("each Sunday looks at its own week", () => {
    const trades = { ...week, "2026-11-16": 500 };
    expect(suggestedCommission(trades, "2026-11-15", 30)).toBe(39.89);
    expect(suggestedCommission(trades, "2026-11-22", 30)).toBe(150);
  });
});

describe("real result per day (trade minus commission)", () => {
  it("subtracts commission on the day it was paid", () => {
    const real = realDays({ "2026-11-13": 6.3 }, { "2026-11-15": 39.89 });
    expect(real["2026-11-13"]).toBeCloseTo(6.3, 2);
    expect(real["2026-11-15"]).toBeCloseTo(-39.89, 2);
  });

  it("combines a trade and a commission that share a date", () => {
    const real = realDays({ "2026-11-15": 10 }, { "2026-11-15": 4 });
    expect(real["2026-11-15"]).toBeCloseTo(6, 2);
  });

  it("does not change the inputs", () => {
    const trades = { "2026-11-13": 6.3 };
    realDays(trades, { "2026-11-15": 1 });
    expect(trades).toEqual({ "2026-11-13": 6.3 });
  });
});

describe("lot sizes", () => {
  const lots = { "2026-11-09": 0.01, "2026-11-11": 0.02 };

  it("lastLotBefore finds the most recent earlier day", () => {
    expect(lastLotBefore(lots, "2026-11-10")).toBe(0.01);
    expect(lastLotBefore(lots, "2026-11-12")).toBe(0.02);
  });

  it("lastLotBefore is undefined when there is none", () => {
    expect(lastLotBefore(lots, "2026-11-09")).toBeUndefined();
    expect(lastLotBefore({}, "2026-11-12")).toBeUndefined();
  });

  it("lotText shows at least two decimals and hides rounding noise", () => {
    expect(lotText(0.01)).toBe("0.01");
    expect(lotText(0.025)).toBe("0.025");
    expect(lotText(1)).toBe("1.00");
    expect(lotText(0.1 + 0.2)).toBe("0.30");
  });
});
