"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusSlice } from "@/lib/dashboard";
import {
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme";

export function StatusDonut({ data }: { data: StatusSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="88%"
          paddingAngle={data.length > 1 ? 2 : 0}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive
          animationDuration={650}
        >
          {data.map((slice) => (
            <Cell key={slice.key} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
