"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { Avatar } from "./avatar";

export function UserMenu({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: Role;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="user-menu" data-open={open} ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={name} avatarUrl={avatarUrl} size={30} />
        <span className="user-menu-name">{name}</span>
        <span className="user-menu-caret" aria-hidden="true">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="user-menu-panel" role="menu" aria-label="Account">
          <div className="user-menu-head">
            <strong>{name}</strong>
            <span>{ROLE_LABEL[role]}</span>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className="user-menu-item danger">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
