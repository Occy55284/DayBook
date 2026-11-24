"use client";
import { lotText } from "@/lib/finance";
import { BALANCE_PER_STEP, LOT_STEP, countdown, isOverLot, lotStep } from "@/lib/lots";
import type { RecentAverage } from "@/lib/lots";
import { useFmt } from "./Privacy";

const dayText = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const shortDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// The lot size your account supports (0.01 lots for every £1,000), how close you are to the next step,
// and a countdown based on your recent average. It only shows what it is given, so it can be tried with any numbers.
// `balance` is null until some capital has been entered. When `hidden` (privacy mode) nothing is shown but dots.
export default function LotView({ balance, avg, last, today, todayLogged, hidden = false }: {
  balance: number | null;
  avg: RecentAverage | null;
  last: { key: string; lot: number } | null;
  today: Date;
  todayLogged: boolean;
  hidden?: boolean;
}) {
  const { money } = useFmt();

  if (balance === null) {
    return (
      <div className="card lot-card" style={{ marginBottom: 16 }}>
        <div className="label">Lot size</div>
        <p className="amount-hint muted" style={{ marginTop: 8 }}>
          Add your starting balance on the Return on your money card to see the lot size your account supports.
        </p>
      </div>
    );
  }
  if (hidden) {
    return (
      <div className="card lot-card" style={{ marginBottom: 16 }}>
        <div className="label">Lot size</div>
        <div className="big masked" aria-hidden="true">••••</div>
        <span className="sr-only">Hidden</span>
        <span className="stat-sub">Hidden by privacy mode. Turn it off at the top of the screen to see it.</span>
      </div>
    );
  }

  const step = lotStep(balance);
  const cd = countdown(step.toGo, avg, today, todayLogged);
  const over = last ? isOverLot(last.lot, step.lot) : false;

  return (
    <div className="card lot-card" style={{ marginBottom: 16 }}>
      <div className="label">Lot size</div>
      <div className="big">
        {lotText(step.lot)}<span className="pence"> lots</span>
      </div>
      <span className="stat-sub">
        {step.lot === 0
          ? `Your rule starts at ${lotText(LOT_STEP)} lots once the account reaches ${money(BALANCE_PER_STEP)}.`
          : `${lotText(LOT_STEP)} lots per ${money(BALANCE_PER_STEP)}, at a balance of ${money(balance)}.`}
      </span>

      <div className="bar" role="progressbar" aria-label={`Progress to ${lotText(step.nextLot)} lots`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(step.progress * 100)}>
        <i style={{ width: `${step.progress * 100}%` }} />
      </div>
      <div className="goalrow">
        <span>{money(step.toGo)} to go</span>
        <span>{lotText(step.nextLot)} lots at {money(step.nextAt)}</span>
      </div>

      {cd.kind === "eta" && (
        <span className="stat-sub">
          {cd.days > 260
            ? `More than a year away at your recent average of ${money(cd.perDay)} a day.`
            : <>About {cd.days} trading {cd.days === 1 ? "day" : "days"} at {money(cd.perDay)} a day, around {dayText(cd.date)}.</>}
          {" "}Based on your last {cd.basedOn} logged {cd.basedOn === 1 ? "day" : "days"}, after commission{cd.basedOn < 5 ? " (only a few days so far, so treat it as rough)" : ""}.
        </span>
      )}
      {cd.kind === "flat" && (
        <span className="stat-sub">Your recent average is not above zero yet, so there is no countdown. It appears once you are back in profit.</span>
      )}
      {cd.kind === "none" && <span className="stat-sub">Log some trading days to see a countdown.</span>}

      {last && (
        <span className="stat-sub lot-last">
          Last traded: {lotText(last.lot)} lots on {shortDay(last.key)}{" "}
          <span className={`lot-flag ${over ? "over" : "ok"}`}>
            {over ? `Above the ${lotText(step.lot)} your balance supports` : "Within your rule"}
          </span>
        </span>
      )}
    </div>
  );
}
