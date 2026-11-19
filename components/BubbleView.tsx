"use client";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { packBubbles } from "@/lib/bubbles";
import { fromKey } from "@/lib/dates";
import { money, signed } from "@/lib/format";

// Floating bubbles, one per item. Bigger bubble = bigger £ amount. Tap a bubble to open it.
// The bubbles drift gently (switched off for people who ask their device for less motion).
//   day        a trading day. Green = a win, red = a loss. value null = no trade yet (a faint dashed "ghost" with a +)
//   commission the Sunday commission (amber). value null = none entered yet (a dashed ghost)
export type BubbleItem = { key: string; value: number | null; kind?: "day" | "commission" };

type Props = {
  items: BubbleItem[];
  todayKey: string;
  onOpen: (key: string, kind: "day" | "commission") => void;
  unitPx?: number;      // how many pixels one layout unit is: the biggest bubble is 2x this across
  labelMinPx?: number;  // a bubble needs at least this radius (px) to show its date as well as its amount
  hint?: string;
  emptyText?: string;
};

export default function BubbleView({
  items, todayKey, onOpen, unitPx = 50, labelMinPx = 34,
  hint = "Bigger bubble = bigger £ amount. Tap a bubble to open that day.", emptyText = "No trades this month yet.",
}: Props) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.key.localeCompare(b.key)), [items]);
  // Sizes follow the £ amount; empty "ghost" bubbles use the smallest size.
  const packed = useMemo(() => packBubbles(sorted.map((e) => e.value ?? 0)), [sorted]);

  if (sorted.length === 0) return <p className="soon" style={{ margin: "32px 0" }}>{emptyText}</p>;

  return (
    <>
      <div className="bubbles" style={{ width: `min(100%, ${Math.round(packed.width * unitPx)}px)`, aspectRatio: `${packed.width} / ${packed.height}` }}>
        {sorted.map((e, i) => {
          const b = packed.items[i];
          const d = fromKey(e.key);
          const kind = e.kind ?? "day";
          const ghost = e.value === null;
          const px = b.r * unitPx; // radius on a full-size screen
          const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
          const style = {
            left: `${((b.x - b.r) / packed.width) * 100}%`,
            top: `${((b.y - b.r) / packed.height) * 100}%`,
            width: `${((2 * b.r) / packed.width) * 100}%`,
            height: `${((2 * b.r) / packed.height) * 100}%`,
            "--dur": `${(5 + ((i * 37) % 40) / 10).toFixed(1)}s`,
            "--del": `${(-((i * 17) % 60) / 10).toFixed(1)}s`,
            "--amt": `${Math.max(10, Math.min(20, px * 0.3)).toFixed(1)}px`,
            "--dat": `${Math.max(9, Math.min(13, px * 0.2)).toFixed(1)}px`,
          } as CSSProperties;
          const tone = kind === "commission" ? "comm" : ghost ? "" : e.value! >= 0 ? "win" : "loss";
          const aria =
            kind === "commission"
              ? ghost ? `${label}, no commission entered yet. Add the commission.` : `${label}, commission of ${money(e.value!)}. Open it.`
              : ghost ? `${label}, no trade yet. Add a trade.` : `${label}, ${e.value! >= 0 ? "profit" : "loss"} of ${money(Math.abs(e.value!))}. Open this day.`;
          const dateText = kind === "commission" ? "Sun" : `${d.getDate()} ${d.toLocaleDateString("en-GB", { weekday: "short" })}`;
          const amountText = ghost ? "＋" : kind === "commission" ? `-${e.value!.toFixed(2)}` : signed(e.value!);
          return (
            <button
              key={e.key}
              type="button"
              className={`bubble ${tone} ${ghost ? "ghost" : ""} ${e.key === todayKey ? "today" : ""}`}
              style={style}
              onClick={() => onOpen(e.key, kind)}
              aria-label={aria}
            >
              {px >= labelMinPx && <span className="bd">{dateText}</span>}
              <span className="ba">{amountText}</span>
            </button>
          );
        })}
      </div>
      <p className="amount-hint muted bubble-hint">{hint}</p>
    </>
  );
}
