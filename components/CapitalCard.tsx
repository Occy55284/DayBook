"use client";
import { useState } from "react";
import { CAPITAL_LABELS, capitalSummary, pctText } from "@/lib/capital";
import { toKey } from "@/lib/dates";
import { money } from "@/lib/format";
import { realDays } from "@/lib/finance";
import type { CapitalEntry, CapitalKind } from "@/lib/store";
import { useData } from "./DataProvider";

const KINDS: CapitalKind[] = ["start", "deposit", "bonus", "withdrawal"];
const cls = (n: number) => (n > 0 ? "pos" : n < 0 ? "neg" : "");

// Your money in the account, and the % you are up on it. All-time, after commission.
export default function CapitalCard() {
  const { trades, commissions, capital, addCapital, removeCapital } = useData();
  const net = Object.values(realDays(trades, commissions)).reduce((s, v) => s + v, 0);
  return <CapitalView entries={capital} net={net} today={new Date()} onAdd={addCapital} onRemove={removeCapital} />;
}

// The card itself. It only shows what it is given, so it can be tried out with any numbers.
export function CapitalView({ entries, net, today, onAdd, onRemove }: {
  entries: CapitalEntry[];
  net: number;
  today: Date;
  onAdd: (e: Omit<CapitalEntry, "id">) => Promise<string | null>;
  onRemove: (id: string) => void;
}) {
  const todayKey = toKey(today);
  const [adding, setAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [kind, setKind] = useState<CapitalKind>(entries.length === 0 ? "start" : "deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

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
      <div className="label">Return on your money</div>

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
    </div>
  );
}
