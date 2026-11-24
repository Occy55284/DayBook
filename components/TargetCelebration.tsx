"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { monthName } from "@/lib/dates";
import { celebrationKey, monthNet, shouldCelebrate } from "@/lib/target";
import { useData } from "./DataProvider";

// A small celebration the first time your profit for the month reaches your monthly target:
// glowing bubbles float up the screen and a banner says so. It never shows an amount, so it is
// safe on a shared screen. Once per month on this device; fades by itself; Escape or a tap closes it.
const COLOURS = ["61, 255, 139", "245, 158, 11", "34, 211, 238"];
const BUBBLES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 7) % 96,                       // % across the screen
  size: 14 + ((i * 13) % 34),                    // px
  delay: ((i * 11) % 14) / 10,                   // seconds
  dur: 2.8 + ((i * 7) % 14) / 10,                // seconds
  drift: ((i * 29) % 70) - 35,                   // px sideways
  colour: COLOURS[i % COLOURS.length],
}));
const doneThisSession = new Set<string>();       // covers the case where the browser blocks storage

export default function TargetCelebration() {
  const { settings, trades, commissions, ready, failed } = useData();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const net = monthNet(trades, commissions, year, month);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ready || failed) return;
    const key = celebrationKey(year, month);
    let done = doneThisSession.has(key);
    try { done = done || localStorage.getItem(key) === "1"; } catch { /* storage blocked */ }
    if (shouldCelebrate(net, settings.monthlyTarget, done)) {
      doneThisSession.add(key);
      try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
      setShow(true);
    }
  }, [ready, failed, net, settings.monthlyTarget, year, month]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 9000);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); window.removeEventListener("keydown", onKey); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="celebrate" role="status" aria-live="polite">
      <div className="celebrate-bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <i key={i} style={{ "--l": `${b.left}%`, "--s": `${b.size}px`, "--dl": `${b.delay}s`, "--d": `${b.dur}s`, "--x": `${b.drift}px`, "--c": b.colour } as CSSProperties} />
        ))}
      </div>
      <div className="celebrate-card">
        <div className="celebrate-title">// TARGET HIT</div>
        <p>You reached your {monthName(month)} target. Nicely done.</p>
        <button type="button" className="b-save cap-btn" onClick={() => setShow(false)}>Nice</button>
      </div>
    </div>
  );
}
