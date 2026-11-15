import { describe, expect, it } from "vitest";
import {
  addDays, commissionSunday, formatWeekRange, fromKey, isTradingDay, monthGrid, toKey, weekDays, weekStart,
} from "../lib/dates";

// d(2026, 11, 9) = Monday 9 November 2026
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const keys = (days: Date[]) => days.map(toKey);

describe("weeks run Monday to Friday", () => {
  it("weekStart is the Monday of the week", () => {
    for (const day of [9, 10, 11, 12, 13]) expect(toKey(weekStart(d(2026, 11, day)))).toBe("2026-11-09");
  });

  it("Saturday and Sunday belong to the week that just ended", () => {
    expect(toKey(weekStart(d(2026, 11, 14)))).toBe("2026-11-09"); // Saturday
    expect(toKey(weekStart(d(2026, 11, 15)))).toBe("2026-11-09"); // Sunday
  });

  it("the next Monday starts a new week", () => {
    expect(toKey(weekStart(d(2026, 11, 16)))).toBe("2026-11-16");
  });

  it("weekDays gives Monday to Friday", () => {
    expect(keys(weekDays(d(2026, 11, 9)))).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13",
    ]);
  });

  it("works across a month and a year end", () => {
    expect(keys(weekDays(d(2026, 11, 30)))).toEqual([
      "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04",
    ]);
    expect(toKey(weekStart(d(2027, 1, 1)))).toBe("2026-12-28"); // Friday 1 Jan 2027
  });

  it("only Monday to Friday are trading days", () => {
    expect([9, 10, 11, 12, 13].every((day) => isTradingDay(d(2026, 11, day)))).toBe(true);
    expect(isTradingDay(d(2026, 11, 14))).toBe(false); // Saturday
    expect(isTradingDay(d(2026, 11, 15))).toBe(false); // Sunday
  });
});

describe("commission is paid on the Sunday after the week", () => {
  it("commissionSunday is two days after Friday", () => {
    expect(toKey(commissionSunday(d(2026, 11, 9)))).toBe("2026-11-15");
    expect(commissionSunday(d(2026, 11, 9)).getDay()).toBe(0);
  });
});

describe("month grid", () => {
  it("November 2026 has 5 week rows and 21 trading days", () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(5);
    expect(grid.flat().filter(Boolean)).toHaveLength(21);
    // 1 Nov is a Sunday, so the first row starts on Monday 2 Nov
    expect(toKey(grid[0][0] as Date)).toBe("2026-11-02");
    // the last row is just Monday 30 Nov
    expect(grid[4].map((x) => (x ? toKey(x) : null))).toEqual(["2026-11-30", null, null, null, null]);
  });

  it("a month that starts on a Saturday begins on the Monday after", () => {
    const grid = monthGrid(2026, 7); // August 2026: 1 Aug is a Saturday
    expect(toKey(grid[0][0] as Date)).toBe("2026-08-03");
    expect(grid.flat().filter(Boolean)).toHaveLength(21);
  });

  it("days outside the month are left blank", () => {
    const grid = monthGrid(2026, 9); // October 2026: 1 Oct is a Thursday
    expect(grid[0].map((x) => (x ? toKey(x) : null))).toEqual([null, null, null, "2026-10-01", "2026-10-02"]);
  });
});

describe("helpers", () => {
  it("formatWeekRange", () => {
    expect(formatWeekRange(d(2026, 11, 9))).toBe("Nov 9 – 13, 2026");
    expect(formatWeekRange(d(2026, 11, 30))).toBe("Nov 30 – Dec 4, 2026");
  });

  it("toKey and fromKey round-trip", () => {
    expect(toKey(fromKey("2026-03-07"))).toBe("2026-03-07");
  });

  it("addDays crosses month ends and clock changes", () => {
    expect(toKey(addDays(d(2026, 11, 30), 1))).toBe("2026-12-01");
    expect(toKey(addDays(d(2026, 10, 24), 2))).toBe("2026-10-26"); // UK clocks go back on 25 Oct
  });
});
