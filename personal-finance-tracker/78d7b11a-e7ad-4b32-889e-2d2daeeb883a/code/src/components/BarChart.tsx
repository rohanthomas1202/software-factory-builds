"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChartDataPoint } from "@/lib/types";

interface BarChartProps {
  data: BarChartDataPoint[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100);
};

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

export function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses))
  );
  const yAxisMax = Math.ceil(maxValue / 100 / 1000) * 1000 * 100; // Round up to nearest $1000

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tickFormatter={formatMonth}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCurrency}
          domain={[0, yAxisMax]}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), "Amount"]}
          labelFormatter={(label) => `Month: ${formatMonth(label)}`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span className="text-gray-700 text-sm capitalize">{value}</span>
          )}
        />
        <Bar
          dataKey="income"
          name="Income"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
          animationDuration={1000}
        />
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
          animationDuration={1000}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}