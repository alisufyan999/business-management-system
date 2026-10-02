"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentSlice } from "@/lib/dashboard-metrics";
import { formatPKR } from "@/lib/format";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function PaymentChart({
  data,
  title = "Payment methods",
  description = "Share of invoice value",
}: {
  data: PaymentSlice[];
  title?: string;
  description?: string;
}) {
  const slices = data.filter((slice) => slice.total > 0);
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No payments to chart yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="total"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {slices.map((slice, index) => (
                      <Cell key={slice.method} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatPKR(Number(value ?? 0))}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col gap-2">
              {slices.map((slice, index) => (
                <li key={slice.method} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: colors[index % colors.length] }}
                    />
                    {slice.label}
                  </span>
                  <span className="text-muted-foreground">
                    {formatPKR(slice.total)}
                    <span className="ml-2 tabular-nums">
                      {total > 0 ? `${Math.round((slice.total / total) * 100)}%` : "0%"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
