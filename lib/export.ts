import type { Commissions, Lots, Trades } from "./store";

// Everything you've entered, as a CSV you can open in Excel or Google Sheets.
// One row per trading day ("trade") and one per Sunday commission ("commission"), oldest first.
export function buildCsv(trades: Trades, lots: Lots, commissions: Commissions): string {
  const rows: { date: string; type: "trade" | "commission"; amount: number; lot: number | undefined }[] = [];
  for (const [date, amount] of Object.entries(trades)) rows.push({ date, type: "trade", amount, lot: lots[date] });
  for (const [date, amount] of Object.entries(commissions)) rows.push({ date, type: "commission", amount, lot: undefined });

  // Same date: trade before commission.
  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.type === b.type ? 0 : a.type === "trade" ? -1 : 1));

  const lines = ["date,type,amount,lot_size"];
  for (const r of rows) lines.push(`${r.date},${r.type},${r.amount},${r.lot ?? ""}`);
  return lines.join("\n") + "\n";
}

export const exportFilename = (today: Date): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `daybook-export-${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}.csv`;
};
