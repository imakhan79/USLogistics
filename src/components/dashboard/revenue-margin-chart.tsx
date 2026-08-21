"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface RevenueMarginPoint {
  date: string;
  revenue: number;
  margin: number;
}

export function RevenueMarginChart({ data }: { data: RevenueMarginPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Margin Trend</CardTitle>
        <CardDescription>Last 14 days</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0077b6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0077b6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00b4d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#0077b6"
              fill="url(#revenueGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="margin"
              name="Margin"
              stroke="#00b4d8"
              fill="url(#marginGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
