import { money, moneyParts, signed } from "./format";
import type { MoneyParts } from "./format";
import { pctText } from "./capital";

// Privacy mode: when you share your screen, every £ amount and % return turns into dots.
// The screens ask for their numbers through this, so one switch covers all of them.
export type Fmt = {
  money: (n: number) => string;          // "£1,234.50"
  moneyCompact: (n: number) => string;   // "£1,000" for whole pounds, otherwise like money()
  signed: (n: number) => string;         // "+41.10"
  pct: (n: number) => string;            // "+46.6%"
  plainPct: (n: number) => string;       // "30%" (how far you are towards a goal)
  parts: (n: number) => MoneyParts;      // the big totals (pence shown smaller)
};

const DOTS = "•••••";
const SYMBOL = moneyParts(0).symbol;

const shown: Fmt = {
  money,
  moneyCompact: (n) => (Number.isInteger(n) ? `${SYMBOL}${n.toLocaleString("en-GB")}` : money(n)),
  signed,
  pct: pctText,
  plainPct: (n) => `${Math.round(n)}%`,
  parts: moneyParts,
};

const hiddenFmt: Fmt = {
  money: () => `${SYMBOL}${DOTS}`,
  moneyCompact: () => `${SYMBOL}${DOTS}`,
  signed: (n) => `${n < 0 ? "-" : "+"}•••`, // the sign stays: a win or a loss is already shown by its colour
  pct: () => "••••",
  plainPct: () => "••%",
  parts: () => ({ sign: "", symbol: SYMBOL, whole: DOTS, pence: "" }),
};

export const makeFmt = (hidden: boolean): Fmt => (hidden ? hiddenFmt : shown);
