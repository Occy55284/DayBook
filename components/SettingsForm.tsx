"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/store";

// Your commission percentage (the share your broker takes each Sunday).
export default function SettingsForm() {
  const { settings, ready, error, saveSettings } = useSettings();
  const [pct, setPct] = useState("30");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Once your saved setting has loaded, show it in the box.
  useEffect(() => {
    if (ready) setPct(String(settings.commissionPct));
  }, [ready, settings.commissionPct]);

  const n = parseFloat(pct);
  const invalid = Number.isNaN(n) || n < 0 || n > 100;

  async function save() {
    if (invalid) return;
    setBusy(true);
    setStatus(null);
    const err = await saveSettings({ commissionPct: n });
    setStatus(err ? `Couldn't save: ${err}` : "Saved");
    setBusy(false);
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="label">Broker commission (%)</div>
      <p className="amount-hint muted" style={{ marginTop: 6 }}>
        Taken each Sunday from last week&apos;s profit. The Sunday entry box fills this in for you.
      </p>
      <input
        className="settings-input"
        inputMode="decimal"
        value={pct}
        onChange={(e) => { setPct(e.target.value); setStatus(null); }}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      {invalid && <p className="neg amount-hint">Enter a number from 0 to 100</p>}
      {error && <p className="neg amount-hint">{error}</p>}
      <button className="b-save signout" style={{ marginTop: 12 }} onClick={save} disabled={invalid || busy}>
        {busy ? "Saving…" : "Save"}
      </button>
      {status && <p className={`amount-hint ${status === "Saved" ? "pos" : "neg"}`}>{status}</p>}
    </div>
  );
}
