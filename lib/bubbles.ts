// Packs one bubble per trading day into a tidy cloud, with no overlaps.
// Everything is worked out in "units" where the biggest bubble has a radius of 1.
// The screen then turns units into pixels, so the same layout works at any width.

export type Bubble = { x: number; y: number; r: number }; // centre and radius, in units
export type Packed = { items: Bubble[]; width: number; height: number };

export const MIN_RADIUS = 0.38; // the smallest day is still big enough to read
export const GAP = 0.07;        // clear space between bubbles

// A day's bubble size follows its £ amount (area grows with the amount), never below MIN_RADIUS.
// Wins and losses are sized the same way: only the size of the amount counts here.
export function bubbleRadius(value: number, maxAbs: number): number {
  const t = maxAbs > 0 ? Math.sqrt(Math.abs(value) / maxAbs) : 0;
  return MIN_RADIUS + (1 - MIN_RADIUS) * t;
}

type Candidate = { x: number; y: number };

// Where a circle of radius r would touch both circle a and circle b (up to two places).
function touchingBoth(a: Bubble, b: Bubble, r: number): Candidate[] {
  const da = a.r + r + GAP;
  const db = b.r + r + GAP;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > da + db || d < Math.abs(da - db)) return [];
  const along = (da * da - db * db + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, da * da - along * along));
  const mx = a.x + (dx * along) / d;
  const my = a.y + (dy * along) / d;
  return [
    { x: mx + (dy * off) / d, y: my - (dx * off) / d },
    { x: mx - (dy * off) / d, y: my + (dx * off) / d },
  ];
}

const clear = (c: Candidate, r: number, placed: Bubble[]) =>
  placed.every((p) => Math.hypot(c.x - p.x, c.y - p.y) >= p.r + r + GAP - 1e-9);

export function packBubbles(values: number[]): Packed {
  if (values.length === 0) return { items: [], width: 0, height: 0 };
  const maxAbs = Math.max(...values.map(Math.abs));
  const radii = values.map((v) => bubbleRadius(v, maxAbs));
  // Biggest first, so the small ones fill the gaps. Ties keep their original order.
  const order = values.map((_, i) => i).sort((i, j) => radii[j] - radii[i] || i - j);

  const placed: Bubble[] = [];
  const result: Bubble[] = new Array(values.length);
  for (const i of order) {
    const r = radii[i];
    let spot: Candidate;
    if (placed.length === 0) {
      spot = { x: 0, y: 0 };
    } else {
      const candidates: Candidate[] = [];
      for (const a of placed) {
        // Ring positions around one circle, so there is always somewhere to try.
        for (let k = 0; k < 24; k++) {
          const ang = (k / 24) * Math.PI * 2;
          candidates.push({ x: a.x + Math.cos(ang) * (a.r + r + GAP), y: a.y + Math.sin(ang) * (a.r + r + GAP) });
        }
      }
      for (let a = 0; a < placed.length; a++)
        for (let b = a + 1; b < placed.length; b++) candidates.push(...touchingBoth(placed[a], placed[b], r));
      // The free spot closest to the middle keeps the cloud round and compact.
      let best: Candidate | null = null;
      let bestScore = Infinity;
      for (const c of candidates) {
        if (!clear(c, r, placed)) continue;
        const score = Math.hypot(c.x, c.y);
        if (score < bestScore - 1e-9) { best = c; bestScore = score; }
      }
      spot = best as Candidate; // the ring around a circle always has a free spot
    }
    const b = { x: spot.x, y: spot.y, r };
    placed.push(b);
    result[i] = b;
  }

  const minX = Math.min(...result.map((b) => b.x - b.r));
  const minY = Math.min(...result.map((b) => b.y - b.r));
  const maxX = Math.max(...result.map((b) => b.x + b.r));
  const maxY = Math.max(...result.map((b) => b.y + b.r));
  return {
    items: result.map((b) => ({ x: b.x - minX, y: b.y - minY, r: b.r })),
    width: maxX - minX,
    height: maxY - minY,
  };
}
