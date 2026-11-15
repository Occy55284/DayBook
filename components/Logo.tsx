// The Daybook mark: a little rising line inside a rounded square. Decorative, so hidden from screen readers.
export default function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e2b3a" />
          <stop offset="100%" stopColor="#0f1722" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
      <path d="M14 42 L26 30 L34 37 L50 20" fill="none" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="20" r="4" fill="#4ade80" />
    </svg>
  );
}
