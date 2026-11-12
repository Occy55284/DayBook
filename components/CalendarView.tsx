"use client";
import { useMemo, useState } from "react";
import {
  TRADING_DAYS, addDays, formatWeekRange, fromKey, isTradingDay,
  monthGrid, monthName, toKey, weekDays, weekStart,
} from "@/lib/dates";
import { Trades, money, signed, useTrades } from "@/lib/store";

type Mode = "week" | "month" | "year" | "all";
const cls = (n: number | undefined) => (n === undefined ? "" : n >= 0 ? "pos" : "neg");

// Sum of all trades whose date key starts with `prefix` (e.g. "2026-11").
function sumPrefix(trades: Trades, prefix: string) {
  return Object.entries(trades).reduce((s, [k, v]) => (k.startsWith(prefix) ? s + v : s), 0);
}

export default function CalendarView() {
  const { trades, setDay } = useTrades();
  const today = new Date();
  const [mode, setMode] = useState<Mode>("week");
  // Start on today, or the coming Sunday if today is Fri/Sat.
  const [anchor, setAnchor] = useState<Date>(() => {
    const t = new Date();
    return isTradingDay(t) ? t : addDays(t, 7 - t.getDay());
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");

  const todayKey = toKey(today);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  function open(key: string) {
    setEditing(key);
    setText(trades[key] !== undefined ? String(trades[key]) : "");
  }
  function save() {
    if (!editing) return;
    const n = parseFloat(text);
    setDay(editing, text.trim() === "" ? null : n);
    setEditing(null);
  }

  function step(dir: number) {
    if (mode === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (mode === "month") setAnchor(new Date(year, month + dir, 1));
    else if (mode === "year") setAnchor(new Date(year + dir, 0, 1));
  }

  const total = useMemo(() => {
    if (mode === "week") return weekDays(weekStart(anchor)).reduce((s, d) => s + (trades[toKey(d)] ?? 0), 0);
    if (mode === "month") return sumPrefix(trades, `${year}-${String(month + 1).padStart(2, "0")}`);
    if (mode === "year") return sumPrefix(trades, `${year}-`);
    return Object.values(trades).reduce((s, v) => s + v, 0);
  }, [mode, anchor, trades, year, month]);

  const heading =
    mode === "week" ? formatWeekRange(weekStart(anchor))
    : mode === "month" ? `${monthName(month)} ${year}`
    : mode === "year" ? String(year) : "All time";

  return (
    <>
      <div className="seg">
        {(["week", "month", "year", "all"] as Mode[]).map((m) => (
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

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Total P&amp;L</div>
        <div className={`big ${cls(total || undefined) || ""}`}>{money(total)}</div>
      </div>

      {mode === "week" &&
        weekDays(weekStart(anchor)).map((d, i) => {
          const k = toKey(d);
          const v = trades[k];
          return (
            <button key={k} className={`weekrow ${k === todayKey ? "today" : ""}`} onClick={() => open(k)}>
              <div className="d">{d.getDate()}<small>{TRADING_DAYS[i]}</small></div>
              <div className={`v ${cls(v)}`}>{v === undefined ? "–" : money(v)}</div>
              <span className="arrow">{v === undefined ? "＋" : "↗"}</span>
            </button>
          );
        })}

      {mode === "month" && (
        <>
          <div className="dow">{TRADING_DAYS.map((d) => <div key={d}>{d}</div>)}</div>
          {monthGrid(year, month).map((row, r) => (
            <div className="grid5" key={r} style={{ marginBottom: 8 }}>
              {row.map((d, c) => {
                if (!d) return <div key={c} className="cell empty" />;
                const k = toKey(d);
                const v = trades[k];
                const state = v === undefined ? "" : v >= 0 ? "win" : "loss";
                return (
                  <button key={c} className={`cell ${state} ${k === todayKey ? "today" : ""}`} onClick={() => open(k)}>
                    <span>{d.getDate()}</span>
                    {v === undefined ? <span className="dash">—</span> : <b>{signed(v)}</b>}
                  </button>
                );
              })}
            </div>
          ))}
        </>
      )}

      {mode === "year" && (
        <div className="months">
          {Array.from({ length: 12 }, (_, m) => {
            const t = sumPrefix(trades, `${year}-${String(m + 1).padStart(2, "0")}`);
            return (
              <button key={m} className="mini" onClick={() => { setAnchor(new Date(year, m, 1)); setMode("month"); }}>
                <h4>{monthName(m).slice(0, 3)}</h4>
                <div className="mg">
                  {monthGrid(year, m).flat().map((d, i) => {
                    if (!d) return <i key={i} className="none" />;
                    const v = trades[toKey(d)];
                    return <i key={i} className={v === undefined ? "" : v >= 0 ? "win" : "loss"} />;
                  })}
                </div>
                <div className={`t ${t === 0 ? "pos" : cls(t)}`}>{money(t)}</div>
              </button>
            );
          })}
        </div>
      )}

      {mode === "all" &&
        (Object.keys(trades).length === 0 ? (
          <p className="soon">No trades yet. Add one from the Week or Month view.</p>
        ) : (
          Array.from(new Set(Object.keys(trades).map((k) => k.slice(0, 4)))).sort().reverse().map((y) => (
            <div key={y} className="allrow">
              <span>{y}</span>
              <span className={cls(sumPrefix(trades, `${y}-`))}>{money(sumPrefix(trades, `${y}-`))}</span>
            </div>
          ))
        ))}

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{fromKey(editing).toDateString()}</h3>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="Profit or loss, e.g. 41.10 or -12.50"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <div className="btns">
              <button className="b-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="b-clear" onClick={() => { setDay(editing, null); setEditing(null); }}>Clear</button>
              <button className="b-save" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
