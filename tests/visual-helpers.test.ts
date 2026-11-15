import { describe, expect, it } from "vitest";
import { smoothPath } from "../lib/curve";
import { money, moneyParts } from "../lib/format";
import { heatLevel, maxAbsOf } from "../lib/heat";

describe("moneyParts (for the big totals)", () => {
  it("splits pounds and pence", () => {
    expect(moneyParts(1234.5)).toEqual({ sign: "", symbol: "£", whole: "1,234", pence: ".50" });
    expect(moneyParts(41.1)).toEqual({ sign: "", symbol: "£", whole: "41", pence: ".10" });
  });
  it("keeps the minus sign for losses", () => {
    expect(moneyParts(-31.33)).toEqual({ sign: "-", symbol: "£", whole: "31", pence: ".33" });
  });
  it("never shows a minus for nothing", () => {
    expect(moneyParts(0)).toEqual({ sign: "", symbol: "£", whole: "0", pence: ".00" });
    expect(moneyParts(-0.001)).toEqual({ sign: "", symbol: "£", whole: "0", pence: ".00" });
  });
  it("always joins back up to exactly what money() shows", () => {
    for (const n of [0, 0.5, 41.1, 999.99, 1000, 1234.5, 123456.78, -0.4, -12.5, -1234.56]) {
      const p = moneyParts(n);
      expect(p.sign + p.symbol + p.whole + p.pence).toBe(money(n));
    }
  });
});

describe("heatLevel", () => {
  it("four levels by size compared with the biggest day", () => {
    expect(heatLevel(5, 20)).toBe(1); // 25% (a quarter counts as the lowest)
    expect(heatLevel(5.1, 20)).toBe(2);
    expect(heatLevel(10, 20)).toBe(2);
    expect(heatLevel(15, 20)).toBe(3);
    expect(heatLevel(15.1, 20)).toBe(4);
    expect(heatLevel(20, 20)).toBe(4);
  });
  it("treats losses the same as wins of the same size", () => {
    expect(heatLevel(-20, 20)).toBe(4);
    expect(heatLevel(-5, 20)).toBe(1);
  });
  it("never goes past the top level", () => {
    expect(heatLevel(500, 20)).toBe(4);
  });
  it("a flat day, or nothing to compare with, is the lowest level", () => {
    expect(heatLevel(0, 20)).toBe(1);
    expect(heatLevel(12, 0)).toBe(1);
    expect(heatLevel(12, NaN)).toBe(1);
  });
  it("maxAbsOf finds the biggest win or loss", () => {
    expect(maxAbsOf([3, -9, 5])).toBe(9);
    expect(maxAbsOf([])).toBe(0);
  });
});

describe("smoothPath (chart curve)", () => {
  const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

  it("handles nothing, one point and two points", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([{ x: 1, y: 2 }])).toBe("M1,2");
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe("M0,0 L10,5");
  });

  it("starts at the first point, ends at the last and has one curve piece per gap", () => {
    const pts = [{ x: 0, y: 10 }, { x: 10, y: 2 }, { x: 20, y: 6 }, { x: 30, y: 1 }];
    const d = smoothPath(pts);
    expect(d.startsWith("M0,10")).toBe(true);
    expect(d.endsWith("30,1")).toBe(true);
    expect((d.match(/C/g) ?? []).length).toBe(3);
  });

  it("never overshoots: a flat stretch stays flat and the curve stays inside the data's range", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 10 }, { x: 30, y: 4 }, { x: 40, y: 4 }, { x: 50, y: 9 }];
    const d = smoothPath(pts);
    const ys = nums(d).filter((_, i) => i % 2 === 1); // every second number is a y (x,y pairs)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(10);
    // between the two points at y=10 the curve is level
    const segment = d.split("C")[2]; // the piece from (10,10) to (20,10)
    const [, c1y, , c2y] = nums(segment);
    expect(c1y).toBe(10);
    expect(c2y).toBe(10);
  });

  it("is a straight line for points on a straight line", () => {
    const d = smoothPath([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 }]);
    const ys = nums(d).filter((_, i) => i % 2 === 1);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
  });
});
