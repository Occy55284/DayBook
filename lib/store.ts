"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

// Day -> profit/loss number, e.g. { "2026-11-09": 41.1 }.
// Saved in Supabase (table: pnl_entries). Only the signed-in user's rows load.
export type Trades = Record<string, number>;
const ACCOUNT = "Main Account";

export function useTrades() {
  const [trades, setTrades] = useState<Trades>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Supabase returns at most 1000 rows per request, so load in pages.
      const all: Trades = {};
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("pnl_entries")
          .select("entry_date, amount")
          .eq("account", ACCOUNT)
          .range(from, from + 999);
        if (error) { if (!cancelled) setError(error.message); break; }
        data.forEach((r) => (all[r.entry_date] = Number(r.amount)));
        if (data.length < 1000) break;
      }
      if (!cancelled) { setTrades(all); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const setDay = useCallback(async (key: string, value: number | null) => {
    const prev = trades;
    // Update the screen right away, then save; undo if saving fails.
    setTrades((t) => {
      const next = { ...t };
      if (value === null || Number.isNaN(value)) delete next[key];
      else next[key] = value;
      return next;
    });
    setError(null);
    const { error } =
      value === null || Number.isNaN(value)
        ? await supabase.from("pnl_entries").delete().eq("account", ACCOUNT).eq("entry_date", key)
        : await supabase.from("pnl_entries").upsert(
            { account: ACCOUNT, entry_date: key, amount: value, updated_at: new Date().toISOString() },
            { onConflict: "user_id,account,entry_date" }
          );
    if (error) { setTrades(prev); setError(`Couldn't save: ${error.message}`); }
  }, [trades]);

  return { trades, setDay, ready, error };
}

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
export const signed = (n: number) =>
  `${n < 0 ? "-" : "+"}${Math.abs(n).toFixed(2)}`;
