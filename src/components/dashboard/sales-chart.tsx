"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySalesPoint } from "@/lib/dashboard-metrics";
import { formatPKR, formatPKRCompact } from "@/lib/format";

export function SalesChart({ data }: { data: DailySalesPoint[] }) {
  const hasSales = data.some((point) => point.total > 0);

  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader>
        <CardTitle>Sales, last 30 days</CardTitle>
        <CardDescription>Daily invoice totals in Pakistani rupees</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSales ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value: number) => formatPKRCompact(value)}
                  tick={{ fontSize: 11 }}
                  width={72}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatPKR(Number(value ?? 0))}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Sales"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No sales recorded in the last 30 days.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
