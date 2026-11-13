// Trading week: Monday to Friday. No trading at the weekend.
// The broker's commission for a week is paid on the Sunday right after its Friday.
// JS getDay(): 0 = Sunday ... 6 = Saturday. Trading days are 1..5.

export const TRADING_DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
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

export const isTradingDay = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;

// Monday that starts the week containing `d`.
// Saturday belongs to the week that just ended, and so does the Sunday after it
// (that Sunday is when the week's commission is paid).
export function weekStart(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sinceMonday = (s.getDay() + 6) % 7; // Mon=0 ... Sat=5, Sun=6
  s.setDate(s.getDate() - sinceMonday);
  return s;
}

// The Sunday when the commission for the week starting `start` (a Monday) is paid.
export const commissionSunday = (start: Date): Date => addDays(start, 6);

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

// The 5 trading days (Mon..Fri) of the week starting at `start`.
export function weekDays(start: Date): Date[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(start, i));
}

// Month grid: rows of 5 cells (Mon..Fri); null = outside this month.
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
