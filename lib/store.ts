"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Day -> profit/loss number, e.g. { "2026-11-09": 41.1 }.
// Saved in Supabase (table: pnl_entries). Only the signed-in user's rows load.
export type Trades = Record<string, number>;
// Day -> lot size you traded that day, e.g. { "2026-11-09": 0.02 }. Display only.
export type Lots = Record<string, number>;
// Sunday date -> broker commission paid that day, e.g. { "2026-11-15": 45.5 }.
// Saved in Supabase (table: pnl_commissions).
export type Commissions = Record<string, number>;
// Your settings. Saved in Supabase (table: pnl_settings).
// monthlyTarget is your profit goal for a calendar month in pounds, or null when you have not set one.
export type Settings = { commissionPct: number; monthlyTarget: number | null };
export const DEFAULT_SETTINGS: Settings = { commissionPct: 30, monthlyTarget: null };

const ACCOUNT = "Main Account";

// Loads something when the screen opens and says honestly how it went:
//   ready  = it loaded fine
//   failed = it did NOT load (so the app must not let you edit and overwrite real data)
// `reload()` tries again.
function useLoader(run: (cancelled: () => boolean) => Promise<string | null>) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    runRef
      .current(() => cancelled)
      .catch((e) => (e instanceof Error ? e.message : String(e)))
      .then((err) => {
        if (cancelled) return;
        if (err) { setError(err); setStatus("failed"); }
        else setStatus("ready");
      });
    return () => { cancelled = true; };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { ready: status === "ready", failed: status === "failed", error, setError, reload };
}

// Put one key of a map back to what it was (or remove it if it didn't exist).
function restoreKey(map: Record<string, number>, key: string, previous: number | undefined) {
  const next = { ...map };
  if (previous === undefined) delete next[key];
  else next[key] = previous;
  return next;
}

export function useTrades() {
  const [trades, setTrades] = useState<Trades>({});
  const [lots, setLots] = useState<Lots>({});
  const tradesRef = useRef(trades);
  tradesRef.current = trades;
  const lotsRef = useRef(lots);
  lotsRef.current = lots;

  const { ready, failed, error, setError, reload } = useLoader(async (cancelled) => {
    // Supabase returns at most 1000 rows per request, so load in pages.
    const all: Trades = {};
    const allLots: Lots = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("pnl_entries")
        .select("entry_date, amount, lot_size")
        .eq("account", ACCOUNT)
        .range(from, from + 999);
      if (error) return error.message;
      data.forEach((r) => {
        all[r.entry_date] = Number(r.amount);
        if (r.lot_size !== null) allLots[r.entry_date] = Number(r.lot_size);
      });
      if (data.length < 1000) break;
    }
    if (!cancelled()) { setTrades(all); setLots(allLots); }
    return null;
  });

  // `value` is the day's profit/loss (null clears the day); `lot` is the lot size (optional).
  const setDay = useCallback(async (key: string, value: number | null, lot?: number | null) => {
    const previousTrade = tradesRef.current[key];
    const previousLot = lotsRef.current[key];
    const remove = value === null || Number.isNaN(value);
    const lotValue = !remove && lot !== null && lot !== undefined && !Number.isNaN(lot) ? lot : null;
    // Update the screen right away, then save; undo just this day if saving fails.
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
    if (error) {
      setTrades((t) => restoreKey(t, key, previousTrade));
      setLots((l) => restoreKey(l, key, previousLot));
      setError(`Couldn't save: ${error.message}`);
    }
  }, [setError]);

  return { trades, lots, setDay, ready, failed, error, reload };
}

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commissions>({});
  const commissionsRef = useRef(commissions);
  commissionsRef.current = commissions;

  const { ready, failed, error, setError, reload } = useLoader(async (cancelled) => {
    const all: Commissions = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("pnl_commissions")
        .select("entry_date, amount")
        .eq("account", ACCOUNT)
        .range(from, from + 999);
      if (error) return error.message;
      data.forEach((r) => (all[r.entry_date] = Number(r.amount)));
      if (data.length < 1000) break;
    }
    if (!cancelled()) setCommissions(all);
    return null;
  });

  const setCommission = useCallback(async (key: string, value: number | null) => {
    const previous = commissionsRef.current[key];
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
    if (error) {
      setCommissions((c) => restoreKey(c, key, previous));
      setError(`Couldn't save commission: ${error.message}`);
    }
  }, [setError]);

  return { commissions, setCommission, ready, failed, error, reload };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { ready, failed, error, reload } = useLoader(async (cancelled) => {
    const { data, error } = await supabase
      .from("pnl_settings")
      .select("commission_pct, monthly_target")
      .eq("account", ACCOUNT)
      .maybeSingle();
    if (error) return error.message;
    if (data && !cancelled()) {
      setSettings({
        commissionPct: Number(data.commission_pct),
        monthlyTarget: data.monthly_target === null ? null : Number(data.monthly_target),
      });
    }
    return null;
  });

  // Returns an error message, or null when it saved fine.
  const saveSettings = useCallback(async (s: Settings): Promise<string | null> => {
    const { error } = await supabase.from("pnl_settings").upsert(
      { account: ACCOUNT, commission_pct: s.commissionPct, monthly_target: s.monthlyTarget, updated_at: new Date().toISOString() },
      { onConflict: "user_id,account" }
    );
    if (error) return error.message;
    setSettings(s);
    return null;
  }, []);

  return { settings, ready, failed, error, reload, saveSettings };
}
