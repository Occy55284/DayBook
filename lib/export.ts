import type { CapitalEntry, Commissions, Lots, Trades } from "./store";

// Everything you've entered, as a CSV you can open in Excel or Google Sheets.
// One row per trading day ("trade"), one per Sunday commission ("commission"), and one per
// capital entry ("start", "deposit", "bonus" or "withdrawal"), oldest first.
export function buildCsv(trades: Trades, lots: Lots, commissions: Commissions, capital: CapitalEntry[] = []): string {
  type Row = { date: string; type: string; amount: number; lot: number | undefined };
  const rows: Row[] = [];
  for (const [date, amount] of Object.entries(trades)) rows.push({ date, type: "trade", amount, lot: lots[date] });
  for (const [date, amount] of Object.entries(commissions)) rows.push({ date, type: "commission", amount, lot: undefined });
  for (const c of capital) rows.push({ date: c.date, type: c.kind, amount: c.amount, lot: undefined });

  // Same date: trade first, then commission, then capital.
  const order = (t: string) => (t === "trade" ? 0 : t === "commission" ? 1 : 2);
  rows.sort((a, b) => a.date.localeCompare(b.date) || order(a.type) - order(b.type));

  const lines = ["date,type,amount,lot_size"];
  for (const r of rows) lines.push(`${r.date},${r.type},${r.amount},${r.lot ?? ""}`);
  return lines.join("\n") + "\n";
}

export const exportFilename = (today: Date): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `daybook-export-${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}.csv`;
};
