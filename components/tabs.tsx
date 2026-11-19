"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/constants";

export function Tabs({ tabs }: { tabs: { key: string; label: string }[] }) {
  const pathname = usePathname();
  const allowed = new Set(tabs.map((tab) => tab.key));
  const labelOf = Object.fromEntries(tabs.map((tab) => [tab.key, tab.label]));

  return (
    <nav className="sidenav" id="tabs" aria-label="Sections">
      {NAV_GROUPS.map((group) => {
        const items = group.tabs.filter((key) => allowed.has(key));
        if (!items.length) return null;
        return (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {items.map((key) => {
              const active =
                pathname === `/${key}` || pathname.startsWith(`/${key}/`);
              return (
                <Link
                  key={key}
                  href={`/${key}`}
                  aria-current={active ? "page" : undefined}
                  className={`nav-item${active ? " active" : ""}`}
                >
                  {labelOf[key] ?? key}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
