"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChartDataPoint } from "@/lib/types";

interface PieChartProps {
  data: PieChartDataPoint[];
  onSliceClick?: (data: PieChartDataPoint) => void;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export function PieChart({ data, onSliceClick }: PieChartProps) {
  const handleClick = (dataPoint: PieChartDataPoint) => {
    if (onSliceClick) {
      onSliceClick(dataPoint);
    }
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          innerRadius={40}
          paddingAngle={2}
          dataKey="value"
          onClick={(_, index) => {
            if (data[index]) handleClick(data[index]);
          }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{
                cursor: onSliceClick ? "pointer" : "default",
                filter: "saturate(1.1)",
              }}
              strokeWidth={2}
              stroke="#fff"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `$${(value / 100).toFixed(2)}`,
            "Amount",
          ]}
          labelFormatter={(label) => `Category: ${label}`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          iconSize={10}
          formatter={(value, entry) => {
            const dataPoint = entry.payload as PieChartDataPoint;
            const percentage = total > 0 ? (dataPoint.value / total) * 100 : 0;
            return (
              <span className="text-gray-700 text-sm">
                {value} ({percentage.toFixed(1)}%)
              </span>
            );
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}