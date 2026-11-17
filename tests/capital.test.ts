import { describe, expect, it } from "vitest";
import { capitalSummary, pctText } from "../lib/capital";
import type { CapitalEntry } from "../lib/store";

let n = 0;
const e = (kind: CapitalEntry["kind"], amount: number, date = "2026-11-01"): CapitalEntry =>
  ({ id: String(++n), date, kind, amount, note: "" });

describe("capitalSummary", () => {
  it("own money is the starting balance plus deposits", () => {
    const s = capitalSummary([e("start", 1000), e("deposit", 500)], 0);
    expect(s.ownMoney).toBe(1500);
    expect(s.bonus).toBe(0);
  });

  it("gives the % up on own money and on own money plus bonus", () => {
    const s = capitalSummary([e("start", 1000), e("bonus", 250)], 200);
    expect(s.pctOwn).toBeCloseTo(20, 10);        // 200 / 1000
    expect(s.pctWithBonus).toBeCloseTo(16, 10);  // 200 / 1250
  });

  it("a loss gives a negative %", () => {
    const s = capitalSummary([e("start", 1000)], -250);
    expect(s.pctOwn).toBeCloseTo(-25, 10);
  });

  it("balance = money in + bonus + profit - withdrawals", () => {
    const s = capitalSummary([e("start", 1000), e("deposit", 200), e("bonus", 50), e("withdrawal", 300)], 400);
    expect(s.balance).toBe(1000 + 200 + 50 + 400 - 300);
    expect(s.withdrawn).toBe(300);
  });

  it("withdrawals do not change the % (taking profit out must not flatter it)", () => {
    const without = capitalSummary([e("start", 1000)], 300);
    const withWd = capitalSummary([e("start", 1000), e("withdrawal", 300)], 300);
    expect(withWd.pctOwn).toBe(without.pctOwn);
    expect(withWd.balance).toBe(1000);
  });

  it("has no % when no own money has been added (only a bonus, or nothing)", () => {
    expect(capitalSummary([], 100).pctOwn).toBeNull();
    const bonusOnly = capitalSummary([e("bonus", 100)], 50);
    expect(bonusOnly.pctOwn).toBeNull();
    expect(bonusOnly.pctWithBonus).toBeCloseTo(50, 10);
  });

  it("copes with pennies without drifting", () => {
    const s = capitalSummary([e("start", 0.1), e("deposit", 0.2)], 0);
    expect(s.ownMoney).toBeCloseTo(0.3, 10);
  });
});

describe("pctText", () => {
  it("shows a sign and one decimal", () => {
    expect(pctText(24.54)).toBe("+24.5%");
    expect(pctText(-3.249)).toBe("-3.2%");
    expect(pctText(0)).toBe("+0.0%");
  });
});
