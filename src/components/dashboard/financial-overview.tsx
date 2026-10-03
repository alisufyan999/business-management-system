"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPKR, formatPKRCompact } from "@/lib/format";
import {
  buildFinancialOverview,
  type ChangeKind,
  type FinancePeriod,
  type FinanceRecords,
  type MetricChange,
  type PeriodFigures,
} from "@/lib/financial-overview";
import { cn } from "@/lib/utils";

const periods: Array<{ value: FinancePeriod; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "half", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
];

const metricCards: Array<{
  key: keyof PeriodFigures;
  label: string;
  higherIsBetter: boolean;
  prominent?: boolean;
}> = [
  { key: "revenue", label: "Total revenue", higherIsBetter: true },
  { key: "cogs", label: "Cost of goods sold", higherIsBetter: false },
  { key: "gross", label: "Gross profit", higherIsBetter: true },
  { key: "expenses", label: "Total expenses", higherIsBetter: false },
  { key: "net", label: "Net profit", higherIsBetter: true, prominent: true },
  { key: "margin", label: "Profit margin", higherIsBetter: true },
];

export function FinancialOverview({ records }: { records: FinanceRecords }) {
  const [period, setPeriod] = useState<FinancePeriod>("monthly");
  const overview = buildFinancialOverview(records, period);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Financial overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Profit for this {overview.noun}, compared with the last one.</p>
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod((value ?? "monthly") as FinancePeriod)}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            {periods.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          overview.insight.tone === "good"
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-amber-500/40 bg-amber-500/10",
        )}
      >
        {overview.insight.text}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <MetricCard
            key={card.key}
            label={card.label}
            value={card.key === "margin" ? `${overview.current.margin.toFixed(1)}%` : formatPKR(overview.current[card.key])}
            change={overview.changes[card.key]}
            higherIsBetter={card.higherIsBetter}
            prominent={card.prominent}
            positive={overview.current.net >= 0}
          />
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Investment and capital</CardTitle>
          <CardDescription>A current snapshot, not limited to the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Snapshot label="Total capital invested" value={formatPKR(overview.capital.invested)} hint="Purchases plus expenses" />
          <Snapshot label="Current stock value" value={formatPKR(overview.capital.stockValue)} hint="Quantity times purchase cost" />
          <Snapshot label="Cash collected" value={formatPKR(overview.capital.cashCollected)} hint="Sale and credit payments" />
          <Snapshot label="Outstanding credit" value={formatPKR(overview.capital.outstandingCredit)} hint="Still to collect" />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>12-month trend</CardTitle>
          <CardDescription>Revenue, expenses, and net profit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" name="Net profit" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top 5 best-selling products</CardTitle>
            <CardDescription>By revenue this {overview.noun}</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products sold in this period.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {overview.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="mr-2 text-muted-foreground">{index + 1}</span>
                      {product.name}
                    </span>
                    <span className="shrink-0 text-right">
                      {formatPKR(product.revenue)}
                      <span className="block text-xs text-muted-foreground">{product.units} sold</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Slow-moving stock</CardTitle>
            <CardDescription>On hand, with no sale in the last 60 days</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.slowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every product in stock has sold in the last 60 days.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.slowStock.map((product) => (
                  <li key={product.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{product.name}</span>
                    <span className="shrink-0 text-right">
                      {formatPKR(product.tiedUp)}
                      <span className="block text-xs text-muted-foreground">{product.quantity} in stock</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  change,
  higherIsBetter,
  prominent,
  positive,
}: {
  label: string;
  value: string;
  change: MetricChange;
  higherIsBetter: boolean;
  prominent?: boolean;
  positive: boolean;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm",
        prominent && "sm:col-span-2",
        prominent && positive && "border-emerald-500/50",
        prominent && !positive && "border-destructive/50",
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("font-semibold tracking-tight", prominent ? "text-3xl" : "text-2xl", prominent && (positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"))}>
          {value}
        </p>
        <ChangeLabel change={change} higherIsBetter={higherIsBetter} />
      </CardContent>
    </Card>
  );
}

function ChangeLabel({ change, higherIsBetter }: { change: MetricChange; higherIsBetter: boolean }) {
  const good = change.kind === "flat" || change.kind === "new" ? null : change.kind === "up" ? higherIsBetter : !higherIsBetter;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-xs",
        good === null && "text-muted-foreground",
        good === true && "text-emerald-600 dark:text-emerald-400",
        good === false && "text-destructive",
      )}
    >
      <ChangeIcon kind={change.kind} />
      {change.label}
      {change.label === "No change" || change.label === "New" ? null : " vs last period"}
    </p>
  );
}

function ChangeIcon({ kind }: { kind: ChangeKind }) {
  if (kind === "up") return <ArrowUp className="size-3" />;
  if (kind === "down") return <ArrowDown className="size-3" />;
  return <Minus className="size-3" />;
}

function Snapshot({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
