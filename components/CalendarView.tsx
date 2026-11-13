"use client";
import { useMemo, useState } from "react";
import {
  TRADING_DAYS, addDays, formatWeekRange, fromKey, isTradingDay,
  monthGrid, monthName, toKey, weekDays, weekStart,
} from "@/lib/dates";
import { lastLotBefore, lastWeekNet, lotText, suggestedCommission } from "@/lib/finance";
import { money, signed, useCommissions, useSettings, useTrades } from "@/lib/store";

type Mode = "week" | "month" | "year" | "all";
type DayMap = Record<string, number>;
const cls = (n: number | undefined) => (n === undefined ? "" : n >= 0 ? "pos" : "neg");
const LOT_CHOICES = [0.01, 0.02, 0.03, 0.04, 0.05];

// Sum of all values whose date key starts with `prefix` (e.g. "2026-11").
function sumPrefix(map: DayMap, prefix: string) {
  return Object.entries(map).reduce((s, [k, v]) => (k.startsWith(prefix) ? s + v : s), 0);
}

export default function CalendarView() {
  const { trades, lots, setDay, error } = useTrades();
  const { commissions, setCommission, error: commError } = useCommissions();
  const { settings } = useSettings();
  const today = new Date();
  const [mode, setMode] = useState<Mode>("week");
  // Start on today, or the coming Sunday if today is Fri/Sat.
  const [anchor, setAnchor] = useState<Date>(() => {
    const t = new Date();
    return isTradingDay(t) ? t : addDays(t, 7 - t.getDay());
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [lotInput, setLotInput] = useState("");
  const [commText, setCommText] = useState("");

  const todayKey = toKey(today);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const isSunday = editing !== null && fromKey(editing).getDay() === 0;

  function open(key: string) {
    setEditing(key);
    const existing = trades[key];
    setText(existing !== undefined ? String(existing) : "");
    // Lot size: show what was saved. For a new trade, start from the last lot you used.
    const lastLot = lastLotBefore(lots, key);
    setLotInput(
      lots[key] !== undefined ? String(lots[key]) : existing === undefined && lastLot !== undefined ? String(lastLot) : ""
    );
    if (fromKey(key).getDay() === 0) {
      // Sunday: show the commission paid, or fill in the suggestion (30% of last week's profit).
      const suggestion = suggestedCommission(trades, key, settings.commissionPct);
      setCommText(
        commissions[key] !== undefined ? String(commissions[key]) : suggestion > 0 ? suggestion.toFixed(2) : ""
      );
    } else {
      setCommText("");
    }
  }
  // Not empty, but not a real number either (e.g. just "-").
  const invalid = text.trim() !== "" && Number.isNaN(parseFloat(text));
  const isLoss = text.trim().startsWith("-");
  // Lot size is optional, but if filled it must be a number above zero.
  const lotInvalid = lotInput.trim() !== "" && !(parseFloat(lotInput) > 0);
  // Commission must be a number that is zero or more.
  const commInvalid =
    isSunday && commText.trim() !== "" && (Number.isNaN(parseFloat(commText)) || parseFloat(commText) < 0);
  const bad = invalid || lotInvalid || commInvalid;

  // The phone number keypad has no minus key, so this button adds/removes it.
  function toggleSign() {
    const t = text.trim();
    setText(t.startsWith("-") ? t.slice(1) : `-${t}`);
  }
  function save() {
    if (!editing || bad) return;
    setDay(
      editing,
      text.trim() === "" ? null : parseFloat(text),
      lotInput.trim() === "" ? null : parseFloat(lotInput)
    );
    if (isSunday) setCommission(editing, commText.trim() === "" ? null : parseFloat(commText));
    setEditing(null);
  }
  function clearDay() {
    if (!editing) return;
    setDay(editing, null);
    if (isSunday) setCommission(editing, null);
    setEditing(null);
  }

  function step(dir: number) {
    if (mode === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (mode === "month") setAnchor(new Date(year, month + dir, 1));
    else if (mode === "year") setAnchor(new Date(year + dir, 0, 1));
  }

  // Total of a day map (trades or commissions) for the period on screen.
  const periodSum = (map: DayMap) => {
    if (mode === "week") return weekDays(weekStart(anchor)).reduce((s, d) => s + (map[toKey(d)] ?? 0), 0);
    if (mode === "month") return sumPrefix(map, `${year}-${String(month + 1).padStart(2, "0")}`);
    if (mode === "year") return sumPrefix(map, `${year}-`);
    return Object.values(map).reduce((s, v) => s + v, 0);
  };
  const tradesTotal = useMemo(() => periodSum(trades), [mode, anchor, trades, year, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const commTotal = useMemo(() => periodSum(commissions), [mode, anchor, commissions, year, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = tradesTotal - commTotal;

  const heading =
    mode === "week" ? formatWeekRange(weekStart(anchor))
    : mode === "month" ? `${monthName(month)} ${year}`
    : mode === "year" ? String(year) : "All time";

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthHasCommission = Object.keys(commissions).some((k) => k.startsWith(monthPrefix));

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

      {(error || commError) && <p className="neg">{error || commError}</p>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Total P&amp;L</div>
        <div className={`big ${cls(total || undefined) || ""}`}>{money(total)}</div>
        {commTotal > 0 && (
          <span className="stat-sub">After {money(commTotal)} commission (trades {money(tradesTotal)})</span>
        )}
      </div>

      {mode === "week" &&
        weekDays(weekStart(anchor)).map((d, i) => {
          const k = toKey(d);
          const v = trades[k];
          const c = commissions[k];
          const lot = lots[k];
          return (
            <button key={k} className={`weekrow ${k === todayKey ? "today" : ""}`} onClick={() => open(k)}>
              <div className="d">{d.getDate()}<small>{TRADING_DAYS[i]}</small></div>
              <div className={`v ${cls(v)}`}>
                {v === undefined ? "–" : money(v)}
                {lot !== undefined && <small>Lot {lotText(lot)}</small>}
                {c !== undefined && <small className="comm">Commission −{money(c)}</small>}
              </div>
              <span className="arrow">{v === undefined && c === undefined ? "＋" : "↗"}</span>
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
                const lot = lots[k];
                const state = v === undefined ? "" : v >= 0 ? "win" : "loss";
                return (
                  <button key={c} className={`cell ${state} ${k === todayKey ? "today" : ""}`} onClick={() => open(k)}>
                    {commissions[k] !== undefined && <i className="cdot" />}
                    <span>{d.getDate()}</span>
                    {v === undefined ? <span className="dash">—</span> : <b>{signed(v)}</b>}
                    {lot !== undefined && <em className="lot">{lotText(lot)}</em>}
                  </button>
                );
              })}
            </div>
          ))}
          {monthHasCommission && <p className="legend"><i className="cdot inline" /> Sunday commission paid</p>}
        </>
      )}

      {mode === "year" && (
        <div className="months">
          {Array.from({ length: 12 }, (_, m) => {
            const p = `${year}-${String(m + 1).padStart(2, "0")}`;
            const t = sumPrefix(trades, p) - sumPrefix(commissions, p);
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
          Array.from(new Set(Object.keys(trades).map((k) => k.slice(0, 4)))).sort().reverse().map((y) => {
            const t = sumPrefix(trades, `${y}-`) - sumPrefix(commissions, `${y}-`);
            return (
              <div key={y} className="allrow">
                <span>{y}</span>
                <span className={cls(t)}>{money(t)}</span>
              </div>
            );
          })
        ))}

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{fromKey(editing).toDateString()}</h3>
            <div className="amount-row">
              <button
                type="button"
                className={`b-sign ${isLoss ? "loss" : "win"}`}
                aria-label={isLoss ? "Loss. Tap to switch to profit" : "Profit. Tap to switch to loss"}
                // Keep the keypad open: don't let the button steal focus from the box.
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleSign}
              >
                {isLoss ? "−" : "+"}
              </button>
              <input
                autoFocus
                inputMode="decimal"
                className={isLoss ? "neg" : ""}
                placeholder="Amount"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </div>
            {invalid && <p className="neg amount-hint">Enter a number, e.g. 41.10</p>}

            <div className="field-label">Lot size you traded</div>
            <div className="chips">
              {LOT_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip ${parseFloat(lotInput) === c ? "on" : ""}`}
                  onClick={() => setLotInput(String(c))}
                >
                  {lotText(c)}
                </button>
              ))}
            </div>
            <input
              inputMode="decimal"
              placeholder="Or type a lot size, e.g. 0.06"
              value={lotInput}
              onChange={(e) => setLotInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            {lotInvalid && <p className="neg amount-hint">Enter a number above 0, e.g. 0.01</p>}

            {isSunday && (
              <>
                <div className="field-label">Broker commission ({settings.commissionPct}% of last week)</div>
                <input
                  inputMode="decimal"
                  placeholder="Commission, e.g. 45.00"
                  value={commText}
                  onChange={(e) => setCommText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
                {commInvalid ? (
                  <p className="neg amount-hint">Enter a number of 0 or more, e.g. 45.00</p>
                ) : (
                  <p className="amount-hint muted">
                    Last week&apos;s trades: {money(lastWeekNet(trades, editing))}. Change the number if your broker took a
                    different amount, or empty it for none.
                  </p>
                )}
              </>
            )}

            <div className="btns">
              <button className="b-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="b-clear" onClick={clearDay}>Clear</button>
              <button className="b-save" onClick={save} disabled={bad}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
