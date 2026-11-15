"use client";

// Shown while your data loads. Nothing can be tapped, so nothing can be overwritten.
export function Skeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">Loading your data…</p>
      <div className="skel" style={{ height: 56, borderRadius: 14 }} />
      <div className="skel" style={{ height: 32, width: "60%", margin: "20px auto 16px" }} />
      <div className="skel" style={{ height: 110, marginBottom: 16 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="skel" style={{ height: 76, marginBottom: 12 }} />
      ))}
    </div>
  );
}

// Shown if your data could not be loaded. Editing is blocked until it loads, so real numbers can't be overwritten.
export function LoadError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="card" role="alert" style={{ marginTop: 24 }}>
      <div className="label">Couldn&apos;t load your data</div>
      <p className="amount-hint muted" style={{ marginTop: 8 }}>
        Your saved numbers are safe. Nothing can be changed until they load, so nothing can be overwritten.
      </p>
      {message && <p className="neg amount-hint">{message}</p>}
      <button className="b-save signout" style={{ marginTop: 12 }} onClick={onRetry}>Try again</button>
    </div>
  );
}
