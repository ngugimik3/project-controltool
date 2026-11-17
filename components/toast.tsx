"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_EVENT = "pct-toast";

export function toast(message: string, ms = 3200) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, ms } }));
}

export function ToastHost() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; ms: number }>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), detail.ms || 3200);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={`toast${visible ? " show" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
