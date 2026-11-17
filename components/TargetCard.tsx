"use client";
import Link from "next/link";
import { toKey } from "@/lib/dates";
import { money } from "@/lib/format";
import { monthTargetProgress } from "@/lib/target";
import { useData } from "./DataProvider";

const days = (n: number) => `${n} trading ${n === 1 ? "day" : "days"}`;

// Progress towards your monthly profit target, with a countdown in trading days.
// `net` is the month's profit after commission; `year` and `month` (0 = January) say which month is on screen.
export default function TargetCard({ net, year, month }: { net: number; year: number; month: number }) {
  const { settings, trades } = useData();
  const today = new Date();
  return (
    <TargetView
      target={settings.monthlyTarget}
      net={net}
      year={year}
      month={month}
      today={today}
      todayLogged={trades[toKey(today)] !== undefined}
    />
  );
}

// The card itself. It only shows what it is given, so it can be tried out with any numbers.
export function TargetView({ target, net, year, month, today, todayLogged }: {
  target: number | null; net: number; year: number; month: number; today: Date; todayLogged: boolean;
}) {
  // No target yet: a gentle nudge to Settings.
  if (target === null) {
    return (
      <Link href="/settings" className="card target-empty">
        Set a monthly profit target <span aria-hidden="true">›</span>
      </Link>
    );
  }

  const p = monthTargetProgress({ target, net, year, month, today, todayLogged });
  const width = Math.min(100, p.pct);

  const right =
    p.status === "reached" ? (net > target ? `Target reached, ${money(net - target)} over` : "Target reached")
    : p.status === "notStarted" ? `${days(p.totalDays)} in this month`
    : p.status === "missed" ? (p.phase === "past" ? `Missed by ${money(p.remaining)}` : `No trading days left, ${money(p.remaining)} short`)
    : `${days(p.daysLeft)} left`;

  return (
    <div className="card target-card">
      <div className="label">Monthly target</div>
      <div className="target-line">
        <span className={p.status === "reached" ? "pos" : ""}>{money(net)}</span>
        <span className="muted"> of {money(target)}</span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-label="Progress towards monthly target"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
      >
        <i style={{ width: `${width}%` }} />
      </div>
      <div className="goalrow">
        <span>{Math.round(p.pct)}%</span>
        <span>{right}</span>
      </div>
      {p.perDay !== null && (p.status === "onTrack" || p.status === "behind" || p.status === "notStarted") && (
        <span className="stat-sub">
          Need {money(p.perDay)} a day to get there
          {p.status !== "notStarted" && (
            <> · <span className={p.status === "onTrack" ? "pos" : "target-behind"}>{p.status === "onTrack" ? "On track" : "Behind pace"}</span></>
          )}
        </span>
      )}
    </div>
  );
}
