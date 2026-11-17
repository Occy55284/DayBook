import { describe, expect, it } from "vitest";
import { countTradingDays, monthTargetProgress } from "../lib/target";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
// November 2026: 1st is a Sunday, the 30th is a Monday. It has 21 trading days.
const base = { target: 1000, year: 2026, month: 10 };

describe("countTradingDays", () => {
  it("counts Monday to Friday only, both ends included", () => {
    expect(countTradingDays(d(2026, 11, 9), d(2026, 11, 13))).toBe(5);   // Mon..Fri
    expect(countTradingDays(d(2026, 11, 9), d(2026, 11, 15))).toBe(5);   // ..Sunday adds none
    expect(countTradingDays(d(2026, 11, 14), d(2026, 11, 15))).toBe(0);  // a weekend
    expect(countTradingDays(d(2026, 11, 9), d(2026, 11, 9))).toBe(1);    // a single day
  });
  it("is 0 when the end is before the start", () => {
    expect(countTradingDays(d(2026, 11, 10), d(2026, 11, 9))).toBe(0);
  });
  it("November 2026 has 21 trading days", () => {
    expect(countTradingDays(d(2026, 11, 1), d(2026, 11, 30))).toBe(21);
  });
});

describe("monthTargetProgress", () => {
  it("counts today as a day left until it is logged", () => {
    // Tue 17 Nov, not logged: 17,18,19,20,23,24,25,26,27,30 = 10 days
    const p = monthTargetProgress({ ...base, net: 400, today: d(2026, 11, 17), todayLogged: false });
    expect(p.daysLeft).toBe(10);
    expect(p.perDay).toBeCloseTo(60, 5); // 600 still needed / 10 days
  });

  it("stops counting today once it is logged", () => {
    const p = monthTargetProgress({ ...base, net: 400, today: d(2026, 11, 17), todayLogged: true });
    expect(p.daysLeft).toBe(9);
    expect(p.perDay).toBeCloseTo(600 / 9, 5);
  });

  it("at the weekend, counting starts from Monday", () => {
    const p = monthTargetProgress({ ...base, net: 0, today: d(2026, 11, 14), todayLogged: false }); // Saturday
    expect(p.daysLeft).toBe(11); // 16..20 (5) + 23..27 (5) + 30 (1)
  });

  it("works out percentage and what is remaining", () => {
    const p = monthTargetProgress({ ...base, net: 250, today: d(2026, 11, 17), todayLogged: true });
    expect(p.pct).toBe(25);
    expect(p.remaining).toBe(750);
  });

  it("is reached when net equals or beats the target, with no per-day figure", () => {
    for (const net of [1000, 1234.5]) {
      const p = monthTargetProgress({ ...base, net, today: d(2026, 11, 17), todayLogged: true });
      expect(p.status).toBe("reached");
      expect(p.remaining).toBe(0);
      expect(p.perDay).toBeNull();
    }
  });

  it("percentage can go over 100, and never below 0 for a losing month", () => {
    expect(monthTargetProgress({ ...base, net: 1500, today: d(2026, 11, 17), todayLogged: true }).pct).toBe(150);
    const losing = monthTargetProgress({ ...base, net: -200, today: d(2026, 11, 17), todayLogged: true });
    expect(losing.pct).toBe(0);
    expect(losing.remaining).toBe(1200);
  });

  it("is on track when at or above the pace, behind when below", () => {
    // Today Tue 17 Nov, logged: 12 of 21 trading days are done (2..6, 9..13, 16, 17 = 12).
    const pace = (1000 * 12) / 21;
    const ahead = monthTargetProgress({ ...base, net: Math.ceil(pace), today: d(2026, 11, 17), todayLogged: true });
    const behind = monthTargetProgress({ ...base, net: Math.floor(pace) - 1, today: d(2026, 11, 17), todayLogged: true });
    expect(ahead.status).toBe("onTrack");
    expect(behind.status).toBe("behind");
  });

  it("a finished month is reached or missed, with no countdown", () => {
    const hit = monthTargetProgress({ ...base, net: 1100, today: d(2026, 12, 3), todayLogged: false });
    const miss = monthTargetProgress({ ...base, net: 900, today: d(2026, 12, 3), todayLogged: false });
    expect(hit.phase).toBe("past");
    expect(hit.status).toBe("reached");
    expect(miss.status).toBe("missed");
    expect(miss.daysLeft).toBe(0);
    expect(miss.perDay).toBeNull();
  });

  it("is missed on the last trading day once it is logged and the target is not hit", () => {
    // Mon 30 Nov is the last trading day of the month.
    const p = monthTargetProgress({ ...base, net: 900, today: d(2026, 11, 30), todayLogged: true });
    expect(p.daysLeft).toBe(0);
    expect(p.status).toBe("missed");
  });

  it("a future month has not started", () => {
    const p = monthTargetProgress({ ...base, month: 11, net: 0, today: d(2026, 11, 17), todayLogged: false });
    expect(p.phase).toBe("future");
    expect(p.status).toBe("notStarted");
    expect(p.daysLeft).toBe(p.totalDays); // December 2026 = 23 trading days
    expect(p.totalDays).toBe(23);
  });
});
