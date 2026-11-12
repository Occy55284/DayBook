// Trading week: Sunday night -> Thursday night (Asia market).
// A Sunday night trade counts on the Sunday square. No Fri/Sat trading.
// JS getDay(): 0 = Sunday ... 6 = Saturday. Trading days are 0..4.

export const TRADING_DAYS = ["SUN", "MON", "TUE", "WED", "THU"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const monthName = (m: number) => MONTHS[m];

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const isTradingDay = (d: Date) => d.getDay() <= 4;

// Sunday that starts the week containing `d`.
export function weekStart(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

// The 5 trading days (Sun..Thu) of the week starting at `start`.
export function weekDays(start: Date): Date[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(start, i));
}

// Month grid: rows of 5 cells (Sun..Thu); null = outside this month.
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const rows: (Date | null)[][] = [];
  let start = weekStart(first);
  while (start <= last) {
    rows.push(
      weekDays(start).map((d) => (d.getMonth() === month && d >= first && d <= last ? d : null))
    );
    start = addDays(start, 7);
  }
  return rows.filter((r) => r.some(Boolean));
}

export function formatWeekRange(start: Date): string {
  const end = addDays(start, 4);
  const m = (d: Date) => MONTHS[d.getMonth()].slice(0, 3);
  return start.getMonth() === end.getMonth()
    ? `${m(start)} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
    : `${m(start)} ${start.getDate()} – ${m(end)} ${end.getDate()}, ${end.getFullYear()}`;
}
