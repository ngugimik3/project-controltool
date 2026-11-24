"use client";

import { Toaster, toast as sonnerToast } from "sonner";

export function toast(message: string, ms = 3200) {
  return sonnerToast(message, { duration: ms });
}

export function ToastHost() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{
        duration: 3200,
        style: {
          background: "var(--tp)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "13.5px",
          boxShadow: "0 10px 28px rgba(15, 31, 42, 0.24)",
        },
      }}
    />
  );
}
