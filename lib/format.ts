// How money is shown. Everything in the app goes through here, so changing the
// currency later (e.g. a per-user setting) is a one-place change.
export const CURRENCY = "GBP";
const LOCALE = "en-GB";

const currencyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1234.5 -> "£1,234.50", -12.5 -> "-£12.50". Tiny amounts that round to nothing show as £0.00 (never "-£0.00").
export const money = (n: number): string => currencyFormat.format(Math.abs(n) < 0.005 ? 0 : n);

// For tight spaces (month cells): "+41.10" or "-12.50", no currency symbol.
export const signed = (n: number): string => `${n < 0 ? "-" : "+"}${Math.abs(n).toFixed(2)}`;

// The same amount split into pieces, so the big totals can show the pence smaller and lighter:
// 1234.5 -> { sign: "", symbol: "£", whole: "1,234", pence: ".50" }.
export type MoneyParts = { sign: string; symbol: string; whole: string; pence: string };
export function moneyParts(n: number): MoneyParts {
  const v = Math.abs(n) < 0.005 ? 0 : n;
  const out: MoneyParts = { sign: "", symbol: "", whole: "", pence: "" };
  for (const p of currencyFormat.formatToParts(v)) {
    if (p.type === "minusSign") out.sign += p.value;
    else if (p.type === "currency") out.symbol += p.value;
    else if (p.type === "integer" || p.type === "group") out.whole += p.value;
    else if (p.type === "decimal" || p.type === "fraction") out.pence += p.value;
  }
  return out;
}

