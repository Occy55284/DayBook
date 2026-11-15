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
