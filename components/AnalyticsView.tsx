"use client";
import { useMemo, useState } from "react";
import { addDays, formatWeekRange, fromKey, monthName, weekStart } from "@/lib/dates";
import {
  Bar, Period, barsForPeriod, currentStreak, entriesInPeriod, runningTotal, summarise,
} from "@/lib/analytics";
import { realDays } from "@/lib/finance";
import { money, useCommissions, useTrades } from "@/lib/store";

const cls = (n: number) => (n > 0 ? "pos" : n < 0 ? "neg" : "");
const shortDate = (key: string) =>
  fromKey(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const W = 340;
const H = 170;
const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
const PLOT_H = H - PAD.top - PAD.bottom;

// Chart 1: one bar per day (or per month in Year / All). Green = profit, red = loss.
function BarChart({ bars }: { bars: Bar[] }) {
  const values = bars.map((b) => b.value ?? 0);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const span = top - bottom || 1;
  const y = (v: number) => PAD.top + ((top - v) / span) * PLOT_H;
  const slot = (W - PAD.left - PAD.right) / bars.length;
  const barW = Math.min(slot * 0.7, 28);
  const labelEvery = Math.ceil(bars.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Profit and loss per day" className="chart">
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#374151" strokeWidth="1" />
      {bars.map((b, i) => {
        const cx = PAD.left + slot * i + slot / 2;
        return (
          <g key={i}>
            {b.value !== null && (
              <rect
                x={cx - barW / 2}
                y={Math.min(y(b.value), y(0))}
                width={barW}
                height={Math.max(Math.abs(y(b.value) - y(0)), 2)}
                rx="3"
                fill={b.value >= 0 ? "var(--green)" : "var(--red)"}
              />
            )}
            {i % labelEvery === 0 && (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">{b.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Chart 2: running total. Goes up when you profit, down when you lose.
function EquityChart({ points }: { points: { key: string; value: number }[] }) {
  if (points.length < 2) {
    return <p className="soon" style={{ margin: "24px 0" }}>Log at least 2 days to see your running total.</p>;
  }
  const values = points.map((p) => p.value);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const span = top - bottom || 1;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + ((top - v) / span) * PLOT_H;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const colour = last.value >= 0 ? "var(--green)" : "var(--red)";
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running total" className="chart">
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
      <path d={area} fill={colour} opacity="0.15" />
      <path d={line} fill="none" stroke={colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r="4" fill={colour} />
      <text x={PAD.left} y={H - 6} fontSize="11" fill="var(--muted)">{shortDate(points[0].key)}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="11" fill="var(--muted)">{shortDate(last.key)}</text>
    </svg>
  );
}

export default function AnalyticsView() {
  const { trades, error } = useTrades();
  const { commissions, error: commError } = useCommissions();
  const [mode, setMode] = useState<Period>("month");
  // Start on this week (at the weekend, the week that just ended).
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  function step(dir: number) {
    if (mode === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (mode === "month") setAnchor(new Date(year, month + dir, 1));
    else if (mode === "year") setAnchor(new Date(year + dir, 0, 1));
  }

  const entries = useMemo(() => entriesInPeriod(trades, mode, anchor), [trades, mode, anchor]);
  const summary = useMemo(() => summarise(entries), [entries]);
  // Commission paid in this period, and the running total AFTER commission.
  const commTotal = useMemo(
    () => entriesInPeriod(commissions, mode, anchor).reduce((s, e) => s + e.value, 0),
    [commissions, mode, anchor]
  );
  const realNet = summary.net - commTotal;
  const curve = useMemo(
    () => runningTotal(entriesInPeriod(realDays(trades, commissions), mode, anchor)),
    [trades, commissions, mode, anchor]
  );
  const bars = useMemo(() => barsForPeriod(trades, mode, anchor), [trades, mode, anchor]);
  const streak = useMemo(() => currentStreak(trades), [trades]);

  const heading =
    mode === "week" ? formatWeekRange(weekStart(anchor))
    : mode === "month" ? `${monthName(month)} ${year}`
    : mode === "year" ? String(year) : "All time";

  const barTitle = mode === "year" || mode === "all" ? "Profit & loss by month" : "Daily profit & loss";

  return (
    <>
      <div className="seg">
        {(["week", "month", "year", "all"] as Period[]).map((m) => (
          <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="nav">
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(-1)} aria-label="Previous">‹</button>}
        <span>{heading}</span>
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(1)} aria-label="Next">›</button>}
      </div>

      {(error || commError) && <p className="neg">{error || commError}</p>}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="label">Net P&amp;L</div>
        <div className={`big ${cls(realNet)}`}>{money(realNet)}</div>
        {commTotal > 0 && (
          <div className="label" style={{ fontSize: 14, marginTop: 4 }}>
            After {money(commTotal)} commission (trades {money(summary.net)})
          </div>
        )}
        <div className="label" style={{ fontSize: 14, marginTop: 4 }}>
          {summary.days} {summary.days === 1 ? "day" : "days"} logged
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="soon">No trades in this period yet.</p>
      ) : (
        <>
          <div className="row2 tiles">
            <div className="card">
              <div className="label">Best day</div>
              <div className="tile pos">{money(summary.best!.value)}</div>
              <small>{shortDate(summary.best!.key)}</small>
            </div>
            <div className="card">
              <div className="label">Worst day</div>
              <div className={`tile ${cls(summary.worst!.value)}`}>{money(summary.worst!.value)}</div>
              <small>{shortDate(summary.worst!.key)}</small>
            </div>
            <div className="card">
              <div className="label">Average day</div>
              <div className={`tile ${cls(summary.average)}`}>{money(summary.average)}</div>
              <small>per logged day</small>
            </div>
            <div className="card">
              <div className="label">Streak</div>
              <div className={`tile ${streak?.kind === "loss" ? "neg" : "pos"}`}>
                {streak ? `${streak.length} ${streak.kind === "win" ? "win" : "loss"}${streak.length === 1 ? "" : streak.kind === "win" ? "s" : "es"}` : "–"}
              </div>
              <small>latest run, all time</small>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="label">{barTitle}</div>
            <BarChart bars={bars} />
          </div>

          <div className="card">
            <div className="label">Running total</div>
            <EquityChart points={curve} />
          </div>
        </>
      )}
    </>
  );
}
