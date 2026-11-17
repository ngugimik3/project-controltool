"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn btp" onClick={() => window.print()}>
      Print / save PDF
    </button>
  );
}
