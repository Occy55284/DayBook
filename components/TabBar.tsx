"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Calendar", icon: "📅" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
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
            <span className="ic" aria-hidden="true">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
