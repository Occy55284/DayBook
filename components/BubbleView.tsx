"use client";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { packBubbles } from "@/lib/bubbles";
import { fromKey } from "@/lib/dates";
import { money, signed } from "@/lib/format";

// One bubble per day you traded. Green = a win, red = a loss. Bigger bubble = bigger £ amount.
// Tap a bubble to open that day. The bubbles drift gently (switched off for people who ask their
// device for less motion). `entries` are the days to show, e.g. { key: "2026-11-09", value: 74.35 }.
const UNIT_PX = 50; // one layout unit on screen: the biggest bubble is 100px across

type Entry = { key: string; value: number };

export default function BubbleView({ entries, todayKey, onOpen }: { entries: Entry[]; todayKey: string; onOpen: (key: string) => void }) {
  const sorted = useMemo(() => [...entries].sort((a, b) => a.key.localeCompare(b.key)), [entries]);
  const packed = useMemo(() => packBubbles(sorted.map((e) => e.value)), [sorted]);

  if (sorted.length === 0) return <p className="soon" style={{ margin: "32px 0" }}>No trades this month yet.</p>;

  return (
    <>
      <div className="bubbles" style={{ width: `min(100%, ${Math.round(packed.width * UNIT_PX)}px)`, aspectRatio: `${packed.width} / ${packed.height}` }}>
        {sorted.map((e, i) => {
          const b = packed.items[i];
          const d = fromKey(e.key);
          const px = b.r * UNIT_PX; // radius on a full-size screen
          const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
          const style = {
            left: `${((b.x - b.r) / packed.width) * 100}%`,
            top: `${((b.y - b.r) / packed.height) * 100}%`,
            width: `${((2 * b.r) / packed.width) * 100}%`,
            height: `${((2 * b.r) / packed.height) * 100}%`,
            "--dur": `${(5 + ((i * 37) % 40) / 10).toFixed(1)}s`,
            "--del": `${(-((i * 17) % 60) / 10).toFixed(1)}s`,
            "--amt": `${Math.max(10, Math.min(19, px * 0.3)).toFixed(1)}px`,
            "--dat": `${Math.max(9, Math.min(13, px * 0.2)).toFixed(1)}px`,
          } as CSSProperties;
          return (
            <button
              key={e.key}
              type="button"
              className={`bubble ${e.value >= 0 ? "win" : "loss"} ${e.key === todayKey ? "today" : ""}`}
              style={style}
              onClick={() => onOpen(e.key)}
              aria-label={`${label}, ${e.value >= 0 ? "profit" : "loss"} of ${money(Math.abs(e.value))}. Open this day.`}
            >
              {px >= 34 && <span className="bd">{d.getDate()} {d.toLocaleDateString("en-GB", { weekday: "short" })}</span>}
              <span className="ba">{signed(e.value)}</span>
            </button>
          );
        })}
      </div>
      <p className="amount-hint muted bubble-hint">Bigger bubble = bigger £ amount. Tap a bubble to open that day.</p>
    </>
  );
}
