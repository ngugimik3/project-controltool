"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  points,
  color,
  id,
}: {
  points: number[];
  color: string;
  id: string;
}) {
  if (points.length < 2) return null;

  const data = points.map((value, index) => ({ index, value }));

  return (
    <div className="kpi-spark">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
