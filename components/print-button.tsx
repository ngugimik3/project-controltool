"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn btp" onClick={() => globalThis.print()}>
      Print / PDF
    </button>
  );
}
