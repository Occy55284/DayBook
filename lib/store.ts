"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

// Day -> profit/loss number, e.g. { "2026-11-09": 41.1 }.
// Saved in Supabase (table: pnl_entries). Only the signed-in user's rows load.
export type Trades = Record<string, number>;
// Day -> lot size you traded that day, e.g. { "2026-11-09": 0.02 }. Display only.
export type Lots = Record<string, number>;
const ACCOUNT = "Main Account";

export function useTrades() {
  const [trades, setTrades] = useState<Trades>({});
  const [lots, setLots] = useState<Lots>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Supabase returns at most 1000 rows per request, so load in pages.
      const all: Trades = {};
      const allLots: Lots = {};
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("pnl_entries")
          .select("entry_date, amount, lot_size")
          .eq("account", ACCOUNT)
          .range(from, from + 999);
        if (error) { if (!cancelled) setError(error.message); break; }
        data.forEach((r) => {
          all[r.entry_date] = Number(r.amount);
          if (r.lot_size !== null) allLots[r.entry_date] = Number(r.lot_size);
        });
        if (data.length < 1000) break;
      }
      if (!cancelled) { setTrades(all); setLots(allLots); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  // `value` is the day's profit/loss (null clears the day); `lot` is the lot size (optional).
  const setDay = useCallback(async (key: string, value: number | null, lot?: number | null) => {
    const prevTrades = trades;
    const prevLots = lots;
    const remove = value === null || Number.isNaN(value);
    const lotValue = !remove && lot !== null && lot !== undefined && !Number.isNaN(lot) ? lot : null;
    // Update the screen right away, then save; undo if saving fails.
    setTrades((t) => {
      const next = { ...t };
      if (remove) delete next[key];
      else next[key] = value as number;
      return next;
    });
    setLots((l) => {
      const next = { ...l };
      if (lotValue === null) delete next[key];
      else next[key] = lotValue;
      return next;
    });
    setError(null);
    const { error } = remove
      ? await supabase.from("pnl_entries").delete().eq("account", ACCOUNT).eq("entry_date", key)
      : await supabase.from("pnl_entries").upsert(
          { account: ACCOUNT, entry_date: key, amount: value, lot_size: lotValue, updated_at: new Date().toISOString() },
          { onConflict: "user_id,account,entry_date" }
        );
    if (error) { setTrades(prevTrades); setLots(prevLots); setError(`Couldn't save: ${error.message}`); }
  }, [trades, lots]);

  return { trades, lots, setDay, ready, error };
}

// Sunday date -> broker commission paid that day, e.g. { "2026-11-15": 45.5 }.
// Saved in Supabase (table: pnl_commissions).
export type Commissions = Record<string, number>;

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commissions>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all: Commissions = {};
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("pnl_commissions")
          .select("entry_date, amount")
          .eq("account", ACCOUNT)
          .range(from, from + 999);
        if (error) { if (!cancelled) setError(error.message); break; }
        data.forEach((r) => (all[r.entry_date] = Number(r.amount)));
        if (data.length < 1000) break;
      }
      if (!cancelled) { setCommissions(all); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const setCommission = useCallback(async (key: string, value: number | null) => {
    const prev = commissions;
    const remove = value === null || Number.isNaN(value);
    setCommissions((c) => {
      const next = { ...c };
      if (remove) delete next[key];
      else next[key] = value as number;
      return next;
    });
    setError(null);
    const { error } = remove
      ? await supabase.from("pnl_commissions").delete().eq("account", ACCOUNT).eq("entry_date", key)
      : await supabase.from("pnl_commissions").upsert(
          { account: ACCOUNT, entry_date: key, amount: value, updated_at: new Date().toISOString() },
          { onConflict: "user_id,account,entry_date" }
        );
    if (error) { setCommissions(prev); setError(`Couldn't save commission: ${error.message}`); }
  }, [commissions]);

  return { commissions, setCommission, ready, error };
}

// Your settings. Saved in Supabase (table: pnl_settings).
export type Settings = { commissionPct: number };
export const DEFAULT_SETTINGS: Settings = { commissionPct: 30 };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("pnl_settings")
        .select("commission_pct")
        .eq("account", ACCOUNT)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      else if (data) setSettings({ commissionPct: Number(data.commission_pct) });
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Returns an error message, or null when it saved fine.
  const saveSettings = useCallback(async (s: Settings): Promise<string | null> => {
    const { error } = await supabase.from("pnl_settings").upsert(
      { account: ACCOUNT, commission_pct: s.commissionPct, updated_at: new Date().toISOString() },
      { onConflict: "user_id,account" }
    );
    if (error) return error.message;
    setSettings(s);
    return null;
  }, []);

  return { settings, ready, error, saveSettings };
}

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
export const signed = (n: number) =>
  `${n < 0 ? "-" : "+"}${Math.abs(n).toFixed(2)}`;
