import type { CSSProperties } from "react";

export const CHART = {
  brand: "var(--chart-brand)",
  green: "var(--chart-green)",
  amber: "var(--chart-amber)",
  red: "var(--chart-red)",
  grey: "var(--chart-grey)",
  grid: "var(--chart-grid)",
  text: "var(--tm)",
} as const;

export const TOOLTIP_STYLE: CSSProperties = {
  background: "var(--s0)",
  border: "1px solid var(--bd)",
  borderRadius: 10,
  boxShadow: "0 10px 26px rgba(15, 31, 42, 0.14)",
  fontSize: 12,
  color: "var(--tp)",
  padding: "8px 10px",
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--ts)",
  fontWeight: 600,
  marginBottom: 4,
};

export const TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: "var(--tp)",
  fontSize: 12,
};

export const AXIS_TICK = { fill: "var(--tm)", fontSize: 11 } as const;
