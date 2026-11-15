// Heat-map colours for the calendar: the bigger a day's win or loss (compared with the biggest in view),
// the stronger its colour. Four levels. The +/- sign is always shown too, so colour is never the only clue.
export type HeatLevel = 1 | 2 | 3 | 4;

export function heatLevel(value: number, maxAbs: number): HeatLevel {
  if (!(maxAbs > 0)) return 1;
  const ratio = Math.min(Math.abs(value) / maxAbs, 1);
  return ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
}

// The biggest win or loss (ignoring sign) among some numbers; 0 if there are none.
export function maxAbsOf(values: Iterable<number>): number {
  let max = 0;
  for (const v of values) if (Math.abs(v) > max) max = Math.abs(v);
  return max;
}
