import { describe, expect, it } from "vitest";
import { GAP, MIN_RADIUS, bubbleRadius, packBubbles } from "../lib/bubbles";

describe("bubbleRadius", () => {
  it("the biggest day gets radius 1 and a zero day the minimum", () => {
    expect(bubbleRadius(80, 80)).toBeCloseTo(1, 10);
    expect(bubbleRadius(-80, 80)).toBeCloseTo(1, 10);
    expect(bubbleRadius(0, 80)).toBeCloseTo(MIN_RADIUS, 10);
  });
  it("wins and losses of the same size get the same bubble", () => {
    expect(bubbleRadius(30, 80)).toBe(bubbleRadius(-30, 80));
  });
  it("a bigger amount is a bigger bubble, and area follows the amount", () => {
    expect(bubbleRadius(60, 80)).toBeGreaterThan(bubbleRadius(20, 80));
    // Above the floor, area (radius squared) grows with the amount, so a day 4x bigger has ~2x the radius.
    const small = bubbleRadius(5, 80) - MIN_RADIUS;
    const big = bubbleRadius(20, 80) - MIN_RADIUS;
    expect(big / small).toBeCloseTo(2, 10);
  });
  it("with no money at all, every bubble is the minimum", () => {
    expect(bubbleRadius(0, 0)).toBe(MIN_RADIUS);
  });
});

describe("packBubbles", () => {
  const month = [45.2, -18.4, 62.1, 30.75, -9.6, 74.35, -12.2, 40.1, 55.0, 6.3, 74.35, 37.54, -31, 19.9, 66.2, -6.1, 12, 23.3, 41.7, -18.9, 29.5, 58.8, 14.8];

  it("nothing in, nothing out", () => {
    expect(packBubbles([])).toEqual({ items: [], width: 0, height: 0 });
  });

  it("one bubble fills its own box", () => {
    const p = packBubbles([50]);
    expect(p.items).toHaveLength(1);
    expect(p.width).toBeCloseTo(2, 10);
    expect(p.height).toBeCloseTo(2, 10);
    expect(p.items[0].x).toBeCloseTo(1, 10);
    expect(p.items[0].y).toBeCloseTo(1, 10);
  });

  it("keeps one bubble per day, in the order given, with the right sizes", () => {
    const p = packBubbles(month);
    expect(p.items).toHaveLength(month.length);
    const maxAbs = Math.max(...month.map(Math.abs));
    p.items.forEach((b, i) => expect(b.r).toBeCloseTo(bubbleRadius(month[i], maxAbs), 10));
  });

  it("no two bubbles overlap, and a small clear gap is kept", () => {
    const p = packBubbles(month);
    for (let i = 0; i < p.items.length; i++)
      for (let j = i + 1; j < p.items.length; j++) {
        const a = p.items[i], b = p.items[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r + GAP - 1e-6);
      }
  });

  it("every bubble sits inside the box that is returned", () => {
    const p = packBubbles(month);
    for (const b of p.items) {
      expect(b.x - b.r).toBeGreaterThanOrEqual(-1e-9);
      expect(b.y - b.r).toBeGreaterThanOrEqual(-1e-9);
      expect(b.x + b.r).toBeLessThanOrEqual(p.width + 1e-9);
      expect(b.y + b.r).toBeLessThanOrEqual(p.height + 1e-9);
    }
  });

  it("makes a compact cloud, not a long line", () => {
    const p = packBubbles(month);
    const ratio = p.width / p.height;
    expect(ratio).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(1.7);
  });

  it("gives the same answer every time", () => {
    expect(packBubbles(month)).toEqual(packBubbles(month));
  });

  it("copes with a full month of identical days, and with all zeros", () => {
    for (const vals of [new Array(22).fill(25), new Array(8).fill(0)]) {
      const p = packBubbles(vals);
      expect(p.items).toHaveLength(vals.length);
      for (let i = 0; i < p.items.length; i++)
        for (let j = i + 1; j < p.items.length; j++)
          expect(Math.hypot(p.items[i].x - p.items[j].x, p.items[i].y - p.items[j].y)).toBeGreaterThanOrEqual(p.items[i].r + p.items[j].r + GAP - 1e-6);
    }
  });
});
