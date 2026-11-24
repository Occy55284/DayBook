"use client";
import { useEffect, useState } from "react";
import { realDays } from "@/lib/finance";
import { useData } from "./DataProvider";
import CapitalView from "./CapitalView";
import { usePrivacy } from "./Privacy";

const KEY = "daybook-hide-return";

// Your money in the account, and the % you are up on it. All-time, after commission.
// A Hide / Show button keeps the figures off the screen while you share it. The choice is remembered on this device.
export default function CapitalCard() {
  const { trades, commissions, capital, addCapital, removeCapital } = useData();
  const net = Object.values(realDays(trades, commissions)).reduce((s, v) => s + v, 0);
  const privacy = usePrivacy();

  // `null` = the saved choice has not been read yet. Until then the card counts as hidden, so a
  // screen share never catches the figures flashing up for a moment before the choice is applied.
  const [hidden, setHidden] = useState<boolean | null>(null);
  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem(KEY) === "hidden"; } catch { /* storage blocked: show it */ }
    setHidden(saved);
  }, []);
  function toggle() {
    const next = !(hidden ?? true);
    setHidden(next);
    try { localStorage.setItem(KEY, next ? "hidden" : "shown"); } catch { /* ignore */ }
  }

  return (
    <CapitalView
      entries={capital}
      net={net}
      today={new Date()}
      onAdd={addCapital}
      onRemove={removeCapital}
      hidden={(hidden ?? true) || privacy.hidden}
      onToggleHidden={privacy.hidden ? undefined : toggle}
    />
  );
}
