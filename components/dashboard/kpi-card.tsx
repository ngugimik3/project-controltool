import type { LucideIcon } from "lucide-react";

const toneClass = {
  brand: "",
  green: "tone-green",
  red: "tone-red",
  amber: "tone-amber",
  grey: "tone-grey",
} as const;

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  note,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "green" | "red" | "amber" | "grey";
  note?: string;
}) {
  return (
    <div className={`kpi-card ${toneClass[tone]}`.trim()}>
      <div className="kpi-card-head">
        <span className="kpi-icon">
          <Icon size={17} />
        </span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {note ? <div className="kpi-note">{note}</div> : null}
    </div>
  );
}
