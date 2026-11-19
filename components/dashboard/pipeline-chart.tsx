"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StageSlice } from "@/lib/dashboard";
import {
  AXIS_TICK,
  CHART,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme";

export function PipelineChart({ data }: { data: StageSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="short"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          interval={0}
          height={34}
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={34}
        />
        <Tooltip
          cursor={{ fill: CHART.grid, opacity: 0.4 }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
        />
        <Bar
          dataKey="value"
          name="Projects"
          fill={CHART.brand}
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
