"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { makeFmt } from "@/lib/privacy";

const KEY = "daybook-privacy";

// Privacy mode for screen sharing. `hidden` = every £ amount and % is shown as dots.
// The choice is remembered on this device. Until it has been read, everything counts as hidden,
// so a screen share never catches the real numbers flashing up first.
type Privacy = { hidden: boolean; toggle: () => void };
const PrivacyContext = createContext<Privacy>({ hidden: false, toggle: () => {} }); // outside the app (tests, previews): not hidden

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState<boolean | null>(null);
  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem(KEY) === "on"; } catch { /* storage blocked: privacy off */ }
    setHidden(saved);
  }, []);
  const value = useMemo<Privacy>(
    () => ({
      hidden: hidden ?? true,
      toggle: () =>
        setHidden((h) => {
          const next = !(h ?? true);
          try { localStorage.setItem(KEY, next ? "on" : "off"); } catch { /* ignore */ }
          return next;
        }),
    }),
    [hidden]
  );
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export const usePrivacy = () => useContext(PrivacyContext);

// The formatters every screen uses for money and %: real numbers, or dots in privacy mode.
export function useFmt() {
  const { hidden } = usePrivacy();
  return useMemo(() => makeFmt(hidden), [hidden]);
}
