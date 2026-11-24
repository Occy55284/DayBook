"use client";
import { useEffect, useState } from "react";
import { CAPITAL_LABELS, capitalSummary } from "@/lib/capital";
import { toKey } from "@/lib/dates";
import type { CapitalEntry, CapitalKind } from "@/lib/store";
import { useFmt } from "./Privacy";

const KINDS: CapitalKind[] = ["start", "deposit", "bonus", "withdrawal"];
const cls = (n: number) => (n > 0 ? "pos" : n < 0 ? "neg" : "");

// The "Return on your money" card. It only shows what it is given, so it can be tried out with any numbers.
// When `hidden` is true (and there is something to hide) NONE of the figures are put on the page at all:
// no %, profit, balance, bonus, history or form. That keeps them out of a screen share, not just blurred.
export default function CapitalView({ entries, net, today, onAdd, onRemove, hidden = false, onToggleHidden }: {
  entries: CapitalEntry[];
  net: number;
  today: Date;
  onAdd: (e: Omit<CapitalEntry, "id">) => Promise<string | null>;
  onRemove: (id: string) => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
}) {
  const { money, pct: pctText } = useFmt();
  const masked = hidden && entries.length > 0;
  const todayKey = toKey(today);
  const [adding, setAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [kind, setKind] = useState<CapitalKind>(entries.length === 0 ? "start" : "deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Hiding closes the form and the history and forgets anything half typed.
  useEffect(() => {
    if (masked) { setAdding(false); setShowHistory(false); setAmount(""); setNote(""); setProblem(null); }
  }, [masked]);

  const s = capitalSummary(entries, net);
  const n = parseFloat(amount);
  const amountBad = amount.trim() !== "" && (Number.isNaN(n) || n <= 0 || n > 100_000_000);
  const dateBad = !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayKey;
  const canSave = amount.trim() !== "" && !amountBad && !dateBad && !busy;

  function open() {
    setKind(entries.length === 0 ? "start" : "deposit");
    setAmount("");
    setDate(todayKey);
    setNote("");
    setProblem(null);
    setAdding(true);
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setProblem(null);
    const err = await onAdd({ date, kind, amount: Math.round(n * 100) / 100, note });
    setBusy(false);
    if (err) setProblem(`Couldn't save: ${err}`);
    else setAdding(false);
  }

  return (
    <div className="card capital-card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div className="label">Return on your money</div>
        {entries.length > 0 && onToggleHidden && (
          <button
            type="button"
            className="eye-btn"
            aria-pressed={masked}
            aria-label={masked ? "Show return on your money" : "Hide return on your money"}
            onClick={onToggleHidden}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {masked
                ? (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>)
                : (<><path d="M3 3l18 18" /><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>)}
            </svg>
            {masked ? "Show" : "Hide"}
          </button>
        )}
      </div>

      {masked ? (
        <>
          <div className="big masked" aria-hidden="true">••••••</div>
          <span className="sr-only">Hidden</span>
          <span className="stat-sub">{onToggleHidden ? "Hidden while you share your screen. Tap Show to see it." : "Hidden by privacy mode. Turn it off at the top of the screen to see it."}</span>
        </>
      ) : (
        <>
          {entries.length === 0 ? (
            <p className="amount-hint muted" style={{ marginTop: 8 }}>
              Add the money you started with, and anything you add later, to see what % you are up.
            </p>
          ) : s.pctOwn === null ? (
            <p className="amount-hint muted" style={{ marginTop: 8 }}>
              Add your starting balance or own money to see your % return. A bonus on its own has nothing to compare with.
            </p>
          ) : (
            <>
              <div className={`big ${cls(s.pctOwn)}`}>{pctText(s.pctOwn)}</div>
              <span className="stat-sub">
                {money(Math.abs(net))} {net < 0 ? "loss" : "profit"} on {money(s.ownMoney)} of your own money
              </span>
              {s.bonus > 0 && s.pctWithBonus !== null && (
                <span className="stat-sub">
                  Counting the {money(s.bonus)} bonus too: <span className={cls(s.pctWithBonus)}>{pctText(s.pctWithBonus)}</span>
                </span>
              )}
              <span className="stat-sub">
                Account balance {money(s.balance)}
                {s.withdrawn > 0 && <> (after {money(s.withdrawn)} withdrawn)</>}
              </span>
            </>
          )}

          {!adding && (
            <div className="cap-actions">
              <button type="button" className="b-save cap-btn" onClick={open}>Add capital</button>
              {entries.length > 0 && (
                <button type="button" className="link-btn" aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
                  {showHistory ? "Hide history" : `History (${entries.length})`}
                </button>
              )}
            </div>
          )}

          {adding && (
            <form className="cap-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <label className="label" htmlFor="cap-kind">What is it?</label>
              <select id="cap-kind" className="settings-input cap-input" value={kind} onChange={(e) => setKind(e.target.value as CapitalKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{CAPITAL_LABELS[k]}</option>)}
              </select>

              <label className="label" htmlFor="cap-amount">Amount (£)</label>
              <input id="cap-amount" className="settings-input cap-input" inputMode="decimal" placeholder="e.g. 1000"
                value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
              {amountBad && <p className="neg amount-hint" role="alert">Enter an amount above 0</p>}

              <label className="label" htmlFor="cap-date">Date</label>
              <input id="cap-date" className="settings-input cap-input" type="date" max={todayKey}
                value={date} onChange={(e) => setDate(e.target.value)} />
              {dateBad && <p className="neg amount-hint" role="alert">Pick a date that is not in the future</p>}

              <label className="label" htmlFor="cap-note">Note (optional)</label>
              <input id="cap-note" className="settings-input cap-input" maxLength={100} placeholder="e.g. welcome bonus"
                value={note} onChange={(e) => setNote(e.target.value)} />

              {problem && <p className="neg amount-hint" role="alert">{problem}</p>}
              <div className="cap-actions">
                <button type="submit" className="b-save cap-btn" disabled={!canSave}>{busy ? "Saving…" : "Save"}</button>
                <button type="button" className="link-btn" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </form>
          )}

          {showHistory && entries.length > 0 && (
            <ul className="cap-list">
              {[...entries].reverse().map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{CAPITAL_LABELS[e.kind]}</strong>
                    <small>{e.date}{e.note ? ` · ${e.note}` : ""}</small>
                  </div>
                  <span className={e.kind === "withdrawal" ? "neg" : "pos"}>{e.kind === "withdrawal" ? "−" : "+"}{money(e.amount)}</span>
                  <button type="button" className="link-btn cap-remove" aria-label={`Remove ${CAPITAL_LABELS[e.kind]} of ${money(e.amount)} on ${e.date}`}
                    onClick={() => onRemove(e.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
