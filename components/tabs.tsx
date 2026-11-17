"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs({ tabs }: { tabs: { key: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="sidenav" id="tabs" aria-label="Sections">
      {tabs.map((tab) => {
        const active =
          pathname === `/${tab.key}` || pathname.startsWith(`/${tab.key}/`);
        return (
          <Link
            key={tab.key}
            href={`/${tab.key}`}
            aria-current={active ? "page" : undefined}
            className={`nav-item${active ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
