"use client";
import { useMemo, useState } from "react";
import { addDays, formatWeekRange, fromKey, monthName, weekStart } from "@/lib/dates";
import {
  Bar, Period, barsForPeriod, currentStreak, entriesInPeriod, runningTotal, summarise,
} from "@/lib/analytics";
import { realDays } from "@/lib/finance";
import { pacePoints } from "@/lib/target";
import { smoothPath } from "@/lib/curve";
import { money } from "@/lib/format";
import { useData } from "./DataProvider";
import { LoadError, Skeleton } from "./LoadState";
import Money from "./Money";
import CapitalCard from "./CapitalCard";
import TargetCard from "./TargetCard";

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
                rx="4"
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
  const line = smoothPath(points.map((p, i) => ({ x: x(i), y: y(p.value) })));
  const last = points[points.length - 1];
  const colour = last.value >= 0 ? "var(--green)" : "var(--red)";
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running total" className="chart">
      <defs>
        <linearGradient id="eqfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#2a3441" strokeWidth="1" strokeDasharray="4 4" />
      <path d={area} fill="url(#eqfade)" />
      <path d={line} fill="none" stroke={colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r="4" fill={colour} />
      <text x={PAD.left} y={H - 6} fontSize="11" fill="var(--muted)">{shortDate(points[0].key)}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="11" fill="var(--muted)">{shortDate(last.key)}</text>
    </svg>
  );
}

// Chart 2b: the same running total, laid out across the whole month's trading days, with a dashed
// "pace" line rising steadily from £0 to your target. Above the dashed line = ahead of pace.
export function TargetEquityChart({ points, target, year, month }: {
  points: { key: string; value: number }[]; target: number; year: number; month: number;
}) {
  const pts = pacePoints(points, year, month);
  const TOP = 24; // a little more room above, for the "Target" label
  const plotH = H - TOP - PAD.bottom;
  const values = pts.map((p) => p.y);
  const top = Math.max(0, target, ...values);
  const bottom = Math.min(0, ...values);
  const span = top - bottom || 1;
  const x = (f: number) => PAD.left + f * (W - PAD.left - PAD.right);
  const y = (v: number) => TOP + ((top - v) / span) * plotH;
  const last = pts[pts.length - 1];
  const colour = last.y >= 0 ? "var(--green)" : "var(--red)";
  const line = smoothPath(pts.map((p) => ({ x: x(p.x), y: y(p.y) })));
  const area = `${line} L${x(last.x).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;
  const first = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const dayLabel = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running total against the pace needed for your monthly target" className="chart">
      <defs>
        <linearGradient id="eqfade2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="#2a3441" strokeWidth="1" strokeDasharray="4 4" />
      <path d={area} fill="url(#eqfade2)" />
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(target)} stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="5 4" strokeOpacity="0.9" />
      <circle cx={x(1)} cy={y(target)} r="3.5" fill="#fbbf24" />
      <text x={x(1)} y={y(target) - 8} textAnchor="end" fontSize="11" fontWeight="700" fill="#fbbf24">Target {Number.isInteger(target) ? `£${target.toLocaleString("en-GB")}` : money(target)}</text>
      <path d={line} fill="none" stroke={colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.x)} cy={y(last.y)} r="4" fill={colour} />
      <text x={PAD.left} y={H - 6} fontSize="11" fill="var(--muted)">{dayLabel(first)}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="11" fill="var(--muted)">{dayLabel(end)}</text>
    </svg>
  );
}

export default function AnalyticsView() {
  const { trades, commissions, settings, ready, failed, error, reload } = useData();
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

  // Wait for your real numbers before showing any totals (no flash of £0.00).
  if (failed) return <LoadError message={error} onRetry={reload} />;
  if (!ready) return <Skeleton />;

  const heading =
    mode === "week" ? formatWeekRange(weekStart(anchor))
    : mode === "month" ? `${monthName(month)} ${year}`
    : mode === "year" ? String(year) : "All time";

  const barTitle = mode === "year" || mode === "all" ? "Profit & loss by month" : "Daily profit & loss";

  return (
    <>
      <div className="seg">
        {(["week", "month", "year", "all"] as Period[]).map((m) => (
          <button key={m} className={mode === m ? "on" : ""} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="nav">
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(-1)} aria-label="Previous">‹</button>}
        <span>{heading}</span>
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(1)} aria-label="Next">›</button>}
      </div>

      {error && <p className="neg" role="alert">{error}</p>}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="label">Net P&amp;L</div>
        <div className={`big ${cls(realNet)}`}><Money value={realNet} /></div>
        {commTotal > 0 && (
          <div className="label sub" style={{ fontSize: 14, marginTop: 4 }}>
            After {money(commTotal)} commission (trades {money(summary.net)})
          </div>
        )}
        <div className="label sub" style={{ fontSize: 14, marginTop: 4 }}>
          {summary.days} {summary.days === 1 ? "day" : "days"} logged
        </div>
      </div>

      {mode === "month" && <TargetCard net={realNet} year={year} month={month} />}

      <CapitalCard />

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
            {mode === "month" && settings.monthlyTarget !== null ? (
              <>
                <TargetEquityChart points={curve} target={settings.monthlyTarget} year={year} month={month} />
                <p className="amount-hint muted" style={{ marginTop: 4 }}>
                  The dashed line is the steady pace to reach your target by the end of the month. Above it means you are ahead.
                </p>
              </>
            ) : (
              <EquityChart points={curve} />
            )}
          </div>
        </>
      )}
    </>
  );
}
