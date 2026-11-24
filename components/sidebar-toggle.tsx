"use client";

import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/ui";

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
      onClick={toggle}
      aria-controls="sidebar"
      aria-expanded={open}
      aria-label={label}
      title={label}
      className={cn(
        "group flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
      )}
    >
      {open ? (
        <PanelLeftClose className="size-4 transition-transform group-hover:scale-110" />
      ) : (
        <PanelLeftOpen className="size-4 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
