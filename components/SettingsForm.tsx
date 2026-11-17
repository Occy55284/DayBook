"use client";
import { useEffect, useState } from "react";
import { buildCsv, exportFilename } from "@/lib/export";
import { useData } from "./DataProvider";
import { LoadError, Skeleton } from "./LoadState";

// Your commission percentage (the share your broker takes each Sunday), and a download of all your data.
export default function SettingsForm() {
  const { settings, saveSettings, trades, lots, commissions, ready, failed, error, reload } = useData();
  const [pct, setPct] = useState("30");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState("");
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [targetBusy, setTargetBusy] = useState(false);

  // Once your saved setting has loaded, show it in the box.
  useEffect(() => {
    if (ready) setPct(String(settings.commissionPct));
  }, [ready, settings.commissionPct]);
  useEffect(() => {
    if (ready) setTarget(settings.monthlyTarget === null ? "" : String(settings.monthlyTarget));
  }, [ready, settings.monthlyTarget]);

  // Until your settings have loaded you can't save, so the default can't overwrite your real setting.
  if (failed) return <LoadError message={error} onRetry={reload} />;
  if (!ready) return <Skeleton />;

  const n = parseFloat(pct);
  const invalid = Number.isNaN(n) || n < 0 || n > 100;

  async function save() {
    if (invalid) return;
    setBusy(true);
    setStatus(null);
    const err = await saveSettings({ ...settings, commissionPct: n });
    setStatus(err ? `Couldn't save: ${err}` : "Saved");
    setBusy(false);
  }

  // The target box: empty means "no target". Otherwise a number above 0.
  const targetNum = target.trim() === "" ? null : parseFloat(target);
  const targetInvalid = targetNum !== null && (Number.isNaN(targetNum) || targetNum <= 0 || targetNum > 10_000_000);

  async function saveTarget() {
    if (targetInvalid) return;
    setTargetBusy(true);
    setTargetStatus(null);
    const err = await saveSettings({ ...settings, monthlyTarget: targetNum });
    setTargetStatus(err ? `Couldn't save: ${err}` : targetNum === null ? "Target removed" : "Saved");
    setTargetBusy(false);
  }

  // Build the CSV in the browser and hand it to you as a download.
  function download() {
    const blob = new Blob([buildCsv(trades, lots, commissions)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(new Date());
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const entryCount = Object.keys(trades).length + Object.keys(commissions).length;

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <label className="label" htmlFor="monthly-target">Monthly profit target (£)</label>
        <p className="amount-hint muted" style={{ marginTop: 6 }}>
          Your goal for each calendar month, after commission. The Calendar&apos;s Month view then shows your progress and
          a countdown in trading days (Monday to Friday). Leave empty for no target.
        </p>
        <input
          id="monthly-target"
          className="settings-input"
          inputMode="decimal"
          placeholder="e.g. 1000"
          value={target}
          onChange={(e) => { setTarget(e.target.value); setTargetStatus(null); }}
          onKeyDown={(e) => e.key === "Enter" && saveTarget()}
        />
        {targetInvalid && <p className="neg amount-hint" role="alert">Enter an amount above 0, or leave it empty</p>}
        <button className="b-save signout" style={{ marginTop: 12 }} onClick={saveTarget} disabled={targetInvalid || targetBusy}>
          {targetBusy ? "Saving…" : "Save"}
        </button>
        {targetStatus && <p className={`amount-hint ${targetStatus.startsWith("Couldn") ? "neg" : "pos"}`} role="status">{targetStatus}</p>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="label" htmlFor="commission-pct">Broker commission (%)</label>
        <p className="amount-hint muted" style={{ marginTop: 6 }}>
          Taken each Sunday from that week&apos;s profit. The Sunday row fills this in for you.
        </p>
        <input
          id="commission-pct"
          className="settings-input"
          inputMode="decimal"
          value={pct}
          onChange={(e) => { setPct(e.target.value); setStatus(null); }}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        {invalid && <p className="neg amount-hint" role="alert">Enter a number from 0 to 100</p>}
        <button className="b-save signout" style={{ marginTop: 12 }} onClick={save} disabled={invalid || busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {status && <p className={`amount-hint ${status === "Saved" ? "pos" : "neg"}`} role="status">{status}</p>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Your data</div>
        <p className="amount-hint muted" style={{ marginTop: 6 }}>
          Download everything you&apos;ve entered as a spreadsheet file (CSV) to keep a backup or open in Excel.
        </p>
        <button className="b-clear signout" style={{ marginTop: 12 }} onClick={download} disabled={entryCount === 0}>
          {entryCount === 0 ? "Nothing to download yet" : `Download my data (${entryCount} ${entryCount === 1 ? "entry" : "entries"})`}
        </button>
      </div>
    </>
  );
}
