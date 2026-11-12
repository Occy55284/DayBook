"use client";
import { useCallback, useEffect, useState } from "react";

// Day -> profit/loss number, e.g. { "2026-11-09": 41.1 }.
// Saved in this browser for now; we'll move it to Supabase later.
export type Trades = Record<string, number>;
const KEY = "pnl-tracker:main";

export function useTrades() {
  const [trades, setTrades] = useState<Trades>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTrades(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const setDay = useCallback((key: string, value: number | null) => {
    setTrades((prev) => {
      const next = { ...prev };
      if (value === null || Number.isNaN(value)) delete next[key];
      else next[key] = value;
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { trades, setDay, ready };
}

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
export const signed = (n: number) =>
  `${n < 0 ? "-" : "+"}${Math.abs(n).toFixed(2)}`;
