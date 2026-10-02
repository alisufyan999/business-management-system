"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR, formatPKRCompact } from "@/lib/format";

export function AgingChart({
  data,
}: {
  data: Array<{ label: string; total: number }>;
}) {
  const hasBalance = data.some((point) => point.total > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Outstanding by age</CardTitle>
        <CardDescription>Open balances as of today</CardDescription>
      </CardHeader>
      <CardContent>
        {hasBalance ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value: number) => formatPKRCompact(value)}
                  tick={{ fontSize: 11 }}
                  width={72}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatPKR(Number(value ?? 0))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="total" name="Outstanding" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">No open credit.</p>
        )}
      </CardContent>
    </Card>
  );
}
