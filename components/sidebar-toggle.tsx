"use client";

import { useEffect, useState } from "react";

const COOKIE = "sidebar";

export function SidebarToggle({ defaultOpen }: { defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const app = document.getElementById("app");
    if (app) app.dataset.sidebar = open ? "open" : "closed";
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.toggleAttribute("inert", !open);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    document.cookie = `${COOKIE}=${next ? "open" : "closed"}; path=/; max-age=31536000; samesite=lax`;
  }

  const label = open ? "Collapse sidebar" : "Expand sidebar";

  return (
    <button
      type="button"
      className="sidebar-toggle"
      onClick={toggle}
      aria-controls="sidebar"
      aria-expanded={open}
      aria-label={label}
      title={label}
    >
      {open ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 4v16" />
          <path d="m15 7-5 5 5 5" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      )}
    </button>
  );
}
