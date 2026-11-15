"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  calendar: (<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  chart: (<><path d="M4 19.5h16" /><path d="M5 15l4.5-5 4 3.5L19.5 6" /></>),
  settings: (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" /></>),
};
const TABS = [
  { href: "/", label: "Calendar", icon: "calendar" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <div className="tabbar">
      <nav aria-label="Main">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={path === t.href ? "on" : ""}
            aria-current={path === t.href ? "page" : undefined}
          >
            <span className="ic" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[t.icon]}
              </svg>
            </span>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
