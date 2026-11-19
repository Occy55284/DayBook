"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TRADING_DAYS, addDays, commissionSunday, formatWeekRange, fromKey,
  monthGrid, monthName, toKey, weekDays, weekStart,
} from "@/lib/dates";
import { lastLotBefore, lotText, suggestedCommission, weekNetBeforeSunday } from "@/lib/finance";
import { money, signed } from "@/lib/format";
import { heatLevel, maxAbsOf } from "@/lib/heat";
import Money from "./Money";
import BubbleView from "./BubbleView";
import TargetCard from "./TargetCard";
import { useData } from "./DataProvider";
import { LoadError, Skeleton } from "./LoadState";

type Mode = "week" | "month" | "year" | "all";
type DayMap = Record<string, number>;
// What the pop-up is editing: a trading day (profit + lot size) or a Sunday's commission.
type Editing = { key: string; kind: "day" | "commission" } | null;
const cls = (n: number | undefined) => (n === undefined ? "" : n >= 0 ? "pos" : "neg");
const LOT_CHOICES = [0.01, 0.02, 0.03, 0.04, 0.05];
const shortDate = (key: string) =>
  fromKey(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Sum of all values whose date key starts with `prefix` (e.g. "2026-11").
function sumPrefix(map: DayMap, prefix: string) {
  return Object.entries(map).reduce((s, [k, v]) => (k.startsWith(prefix) ? s + v : s), 0);
}

export default function CalendarView() {
  const { trades, lots, commissions, settings, setDay, setCommission, ready, failed, error, reload } = useData();
  const today = new Date();
  const [mode, setMode] = useState<Mode>("week");
  // Start on this week (at the weekend that is the week that just ended, so you can add its commission).
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [editing, setEditing] = useState<Editing>(null);
  // Month view can show the grid of day squares or floating bubbles; the choice is remembered.
  const [monthView, setMonthView] = useState<"grid" | "bubbles">("grid");
  useEffect(() => {
    try { if (localStorage.getItem("daybook-month-view") === "bubbles") setMonthView("bubbles"); } catch { /* storage blocked: keep the grid */ }
  }, []);
  function chooseMonthView(v: "grid" | "bubbles") {
    setMonthView(v);
    try { localStorage.setItem("daybook-month-view", v); } catch { /* ignore */ }
  }
  const [text, setText] = useState("");
  const [lotInput, setLotInput] = useState("");
  const [commText, setCommText] = useState("");
  // After clearing a day or a commission, offer to put it back for a few seconds.
  const [undo, setUndo] = useState<{ message: string; restore: () => void } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const todayKey = toKey(today);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(id);
  }, [undo]);

  // Pop-up keyboard support: Escape closes it, Tab stays inside it.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      } else if (e.key === "Tab" && dialogRef.current) {
        const items = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])")
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function rememberOpener() {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  // Close the pop-up and hand focus back to the button that opened it.
  function closeModal() {
    setEditing(null);
    const el = openerRef.current;
    if (el) setTimeout(() => el.focus(), 0);
  }

  function open(key: string) {
    rememberOpener();
    setEditing({ key, kind: "day" });
    const existing = trades[key];
    setText(existing !== undefined ? String(existing) : "");
    // Lot size: show what was saved. For a new trade, start from the last lot you used.
    const lastLot = lastLotBefore(lots, key);
    setLotInput(
      lots[key] !== undefined ? String(lots[key]) : existing === undefined && lastLot !== undefined ? String(lastLot) : ""
    );
  }
  // `sundayKey` is the Sunday after a Monday-to-Friday week, when its commission is paid.
  function openCommission(sundayKey: string) {
    rememberOpener();
    setEditing({ key: sundayKey, kind: "commission" });
    const suggestion = suggestedCommission(trades, sundayKey, settings.commissionPct);
    setCommText(
      commissions[sundayKey] !== undefined ? String(commissions[sundayKey]) : suggestion > 0 ? suggestion.toFixed(2) : ""
    );
  }

  // Not empty, but not a real number either (e.g. just "-").
  const invalid = text.trim() !== "" && Number.isNaN(parseFloat(text));
  const isLoss = text.trim().startsWith("-");
  // Lot size is optional, but if filled it must be a number above zero.
  const lotInvalid = lotInput.trim() !== "" && !(parseFloat(lotInput) > 0);
  // Commission must be a number that is zero or more.
  const commInvalid = commText.trim() !== "" && (Number.isNaN(parseFloat(commText)) || parseFloat(commText) < 0);
  const bad = editing?.kind === "commission" ? commInvalid : invalid || lotInvalid;

  // The phone number keypad has no minus key, so this button adds/removes it.
  function toggleSign() {
    const t = text.trim();
    setText(t.startsWith("-") ? t.slice(1) : `-${t}`);
  }
  function save() {
    if (!editing || bad) return;
    if (editing.kind === "commission") {
      setCommission(editing.key, commText.trim() === "" ? null : parseFloat(commText));
    } else {
      setDay(
        editing.key,
        text.trim() === "" ? null : parseFloat(text),
        lotInput.trim() === "" ? null : parseFloat(lotInput)
      );
    }
    closeModal();
  }
  // Clear removes the day (or the commission) but keeps a few seconds to undo it.
  function clearDay() {
    if (!editing) return;
    const { key, kind } = editing;
    if (kind === "commission") {
      const previous = commissions[key];
      if (previous !== undefined) {
        setCommission(key, null);
        setUndo({ message: "Commission cleared", restore: () => setCommission(key, previous) });
      }
    } else {
      const previous = trades[key];
      const previousLot = lots[key];
      if (previous !== undefined) {
        setDay(key, null);
        setUndo({ message: `${shortDate(key)} cleared`, restore: () => setDay(key, previous, previousLot ?? null) });
      }
    }
    closeModal();
  }

  function step(dir: number) {
    if (mode === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (mode === "month") setAnchor(new Date(year, month + dir, 1));
    else if (mode === "year") setAnchor(new Date(year + dir, 0, 1));
  }

  const monday = weekStart(anchor);
  const sundayKey = toKey(commissionSunday(monday));

  // Total of a day map (trades or commissions) for the period on screen.
  // A week includes the Sunday after it, because that is when its commission is paid.
  const periodSum = (map: DayMap) => {
    if (mode === "week") return [...weekDays(monday), commissionSunday(monday)].reduce((s, d) => s + (map[toKey(d)] ?? 0), 0);
    if (mode === "month") return sumPrefix(map, `${year}-${String(month + 1).padStart(2, "0")}`);
    if (mode === "year") return sumPrefix(map, `${year}-`);
    return Object.values(map).reduce((s, v) => s + v, 0);
  };
  const tradesTotal = useMemo(() => periodSum(trades), [mode, anchor, trades, year, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const commTotal = useMemo(() => periodSum(commissions), [mode, anchor, commissions, year, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = tradesTotal - commTotal;

  // Until your real numbers have loaded, nothing can be tapped, so nothing can be overwritten.
  if (failed) return (<><h1 className="sr-only">Calendar</h1><LoadError message={error} onRetry={reload} /></>);
  if (!ready) return (<><h1 className="sr-only">Calendar</h1><Skeleton /></>);

  const heading =
    mode === "week" ? formatWeekRange(monday)
    : mode === "month" ? `${monthName(month)} ${year}`
    : mode === "year" ? String(year) : "All time";

  const weekComm = commissions[sundayKey];
  // Colour strength is compared with the biggest win or loss on screen.
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const heatMax = maxAbsOf(
    mode === "week"
      ? weekDays(monday).map((d) => trades[toKey(d)]).filter((v): v is number => v !== undefined)
      : Object.entries(trades).filter(([k]) => k.startsWith(monthPrefix)).map(([, v]) => v)
  );
  const heatClass = (v: number | undefined) => (v === undefined ? "" : `${v >= 0 ? "win" : "loss"} h${heatLevel(v, heatMax)}`);

  return (
    <>
      <h1 className="sr-only">Calendar</h1>
      <div className="seg">
        {(["week", "month", "year", "all"] as Mode[]).map((m) => (
          <button key={m} className={mode === m ? "on" : ""} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="nav">
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(-1)} aria-label="Previous">‹</button>}
        <span aria-live="polite">{heading}</span>
        {mode === "all" ? <span style={{ width: 40 }} /> : <button onClick={() => step(1)} aria-label="Next">›</button>}
      </div>

      {error && <p className="neg" role="alert">{error}</p>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Total P&amp;L</div>
        <div className={`big ${cls(total || undefined) || ""}`}><Money value={total} /></div>
        {commTotal > 0 && (
          <span className="stat-sub">After {money(commTotal)} commission (trades {money(tradesTotal)})</span>
        )}
      </div>

      {mode === "month" && <TargetCard net={total} year={year} month={month} />}

      {mode === "week" && (
        <>
          {weekDays(monday).map((d, i) => {
            const k = toKey(d);
            const v = trades[k];
            const lot = lots[k];
            return (
              <button
                key={k}
                className={`weekrow ${heatClass(v)} ${k === todayKey ? "today" : ""}`}
                onClick={() => open(k)}
              >
                <div className="d">{d.getDate()}<small>{TRADING_DAYS[i]}</small></div>
                <div className={`v ${cls(v)}`}>
                  {v === undefined ? (
                    <>
                      <span aria-hidden="true">–</span>
                      <span className="sr-only">no trade</span>
                    </>
                  ) : (
                    money(v)
                  )}
                  {lot !== undefined && <small>Lot {lotText(lot)}</small>}
                </div>
                <span className="arrow" aria-hidden="true">{v === undefined ? "＋" : "↗"}</span>
              </button>
            );
          })}
          <button
            className={`weekrow comm-row ${sundayKey === todayKey ? "today" : ""}`}
            onClick={() => openCommission(sundayKey)}
          >
            <div className="d">{commissionSunday(monday).getDate()}<small>SUN</small></div>
            <div className="v">
              {weekComm === undefined ? <span className="muted">Commission</span> : <span className="commtext">−{money(weekComm)}</span>}
              <small>{weekComm === undefined ? "Paid on Sunday for this week" : "Commission paid"}</small>
            </div>
            <span className="arrow" aria-hidden="true">{weekComm === undefined ? "＋" : "↗"}</span>
          </button>
        </>
      )}

      {mode === "month" && (
        <div className="view-switch" role="group" aria-label="Month view style">
          <button type="button" className={monthView === "grid" ? "on" : ""} aria-pressed={monthView === "grid"} onClick={() => chooseMonthView("grid")}>Grid</button>
          <button type="button" className={monthView === "bubbles" ? "on" : ""} aria-pressed={monthView === "bubbles"} onClick={() => chooseMonthView("bubbles")}>Bubbles</button>
        </div>
      )}

      {mode === "month" && monthView === "bubbles" && (
        <BubbleView
          entries={Object.entries(trades).filter(([k]) => k.startsWith(monthPrefix)).map(([key, value]) => ({ key, value }))}
          todayKey={todayKey}
          onOpen={open}
        />
      )}

      {mode === "month" && monthView === "grid" && (
        <>
          <div className="dow" aria-hidden="true">{TRADING_DAYS.map((d) => <div key={d}>{d}</div>)}</div>
          {monthGrid(year, month).map((row, r) => {
            // The Sunday after this row's week, when its commission is paid.
            const rowSunday = toKey(commissionSunday(weekStart(row.find(Boolean) as Date)));
            const rowComm = commissions[rowSunday];
            return (
              <div key={r} style={{ marginBottom: 8 }}>
                <div className="grid5">
                  {row.map((d, c) => {
                    if (!d) return <div key={c} className="cell empty" aria-hidden="true" />;
                    const k = toKey(d);
                    const v = trades[k];
                    const lot = lots[k];
                    const state = heatClass(v);
                    return (
                      <button
                        key={c}
                        className={`cell ${state} ${k === todayKey ? "today" : ""}`}
                        onClick={() => open(k)}
                      >
                        <span>
                          {d.getDate()}
                          <span className="sr-only"> {d.toLocaleDateString("en-GB", { weekday: "long" })}</span>
                        </span>
                        {v === undefined ? (
                          <>
                            <span className="dash" aria-hidden="true">—</span>
                            <span className="sr-only">no trade</span>
                          </>
                        ) : (
                          <b>{signed(v)}</b>
                        )}
                        {lot !== undefined && (
                          <em className="lot"><span className="sr-only">lot </span>{lotText(lot)}</em>
                        )}
                      </button>
                    );
                  })}
                </div>
                {rowComm !== undefined && (
                  <button className="comm-strip" onClick={() => openCommission(rowSunday)}>
                    Sun {shortDate(rowSunday)} · Commission −{money(rowComm)}
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}

      {mode === "year" && (
        <div className="months">
          {Array.from({ length: 12 }, (_, m) => {
            const p = `${year}-${String(m + 1).padStart(2, "0")}`;
            const t = sumPrefix(trades, p) - sumPrefix(commissions, p);
            return (
              <button
                key={m}
                className="mini"
                onClick={() => { setAnchor(new Date(year, m, 1)); setMode("month"); }}
              >
                <h2>{monthName(m).slice(0, 3)}</h2>
                <div className="mg" aria-hidden="true">
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

      {undo && (
        <div className="toast" role="status">
          <span>{undo.message}</span>
          <button onClick={() => { undo.restore(); setUndo(null); }}>Undo</button>
        </div>
      )}

      {editing && (
        <div className="modal-bg" onClick={closeModal}>
          <div
            className="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialog-title">{fromKey(editing.key).toDateString()}</h2>

            {editing.kind === "day" ? (
              <>
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
                    aria-label="Profit or loss amount in pounds"
                    placeholder="Amount"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save()}
                  />
                </div>
                {invalid && <p className="neg amount-hint" role="alert">Enter a number, e.g. 41.10</p>}

                <div className="field-label">Lot size you traded</div>
                <div className="chips">
                  {LOT_CHOICES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${parseFloat(lotInput) === c ? "on" : ""}`}
                      aria-pressed={parseFloat(lotInput) === c}
                      onClick={() => setLotInput(String(c))}
                    >
                      {lotText(c)}
                    </button>
                  ))}
                </div>
                <input
                  inputMode="decimal"
                  aria-label="Lot size"
                  placeholder="Or type a lot size, e.g. 0.06"
                  value={lotInput}
                  onChange={(e) => setLotInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
                {lotInvalid && <p className="neg amount-hint" role="alert">Enter a number above 0, e.g. 0.01</p>}
              </>
            ) : (
              <>
                <div className="field-label" style={{ marginTop: 0 }}>
                  Broker commission ({settings.commissionPct}% of the week&apos;s profit)
                </div>
                <input
                  autoFocus
                  inputMode="decimal"
                  aria-label="Broker commission in pounds"
                  placeholder="Commission, e.g. 45.00"
                  value={commText}
                  onChange={(e) => setCommText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
                {commInvalid ? (
                  <p className="neg amount-hint" role="alert">Enter a number of 0 or more, e.g. 45.00</p>
                ) : (
                  <p className="amount-hint muted">
                    This week&apos;s trades (Mon–Fri): {money(weekNetBeforeSunday(trades, editing.key))}. Change the number if
                    your broker took a different amount, or empty it for none.
                  </p>
                )}
              </>
            )}

            <div className="btns">
              <button className="b-cancel" onClick={closeModal}>Cancel</button>
              <button className="b-clear" onClick={clearDay}>Clear</button>
              <button className="b-save" onClick={save} disabled={bad}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
