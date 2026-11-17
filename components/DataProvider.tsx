"use client";
import { createContext, useContext, useMemo } from "react";
import {
  CapitalEntry, Commissions, Lots, Settings, Trades, useCapital, useCommissions, useSettings, useTrades,
} from "@/lib/store";

// Loads your data ONCE when you sign in and shares it with every screen,
// so switching tabs is instant and never flashes empty numbers.
type Data = {
  trades: Trades;
  lots: Lots;
  commissions: Commissions;
  settings: Settings;
  setDay: ReturnType<typeof useTrades>["setDay"];
  setCommission: ReturnType<typeof useCommissions>["setCommission"];
  saveSettings: ReturnType<typeof useSettings>["saveSettings"];
  capital: CapitalEntry[];
  addCapital: ReturnType<typeof useCapital>["addCapital"];
  removeCapital: ReturnType<typeof useCapital>["removeCapital"];
  ready: boolean; // everything has loaded
  failed: boolean; // something did NOT load: screens must not allow editing
  error: string | null; // the latest problem (a failed load or a failed save)
  reload: () => void;
};

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const t = useTrades();
  const c = useCommissions();
  const s = useSettings();
  const k = useCapital();

  const value = useMemo<Data>(
    () => ({
      trades: t.trades,
      lots: t.lots,
      commissions: c.commissions,
      settings: s.settings,
      setDay: t.setDay,
      setCommission: c.setCommission,
      saveSettings: s.saveSettings,
      capital: k.entries,
      addCapital: k.addCapital,
      removeCapital: k.removeCapital,
      ready: t.ready && c.ready && s.ready && k.ready,
      failed: t.failed || c.failed || s.failed || k.failed,
      error: t.error ?? c.error ?? s.error ?? k.error,
      reload: () => { t.reload(); c.reload(); s.reload(); k.reload(); },
    }),
    [t, c, s, k]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Data {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
