"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/dashboard";
import {
  AXIS_TICK,
  CHART,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="dashCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.34} />
            <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="dashCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.green} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART.green} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={34}
        />
        <Tooltip
          cursor={{ stroke: CHART.brand, strokeWidth: 1, strokeDasharray: "4 4" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
        />
        <Area
          type="monotone"
          dataKey="created"
          name="Created"
          stroke={CHART.brand}
          strokeWidth={2}
          fill="url(#dashCreated)"
          animationDuration={750}
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke={CHART.green}
          strokeWidth={2}
          fill="url(#dashCompleted)"
          animationDuration={750}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
