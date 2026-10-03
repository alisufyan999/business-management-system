import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { sumOutstandingCredit, sumStockValue } from "@/lib/dashboard-metrics";
import { formatPKR } from "@/lib/format";
import { inDateRange, summarizeSales } from "@/lib/reports";
import { lineTotal } from "@/lib/sale-fields";
import type { CreditLedgerEntry, Expense, Payment, Product, Purchase, Sale } from "@/lib/types";

export type FinancePeriod = "monthly" | "half" | "yearly";

export interface PeriodWindow {
  from: string;
  to: string;
}

export interface PeriodFigures {
  revenue: number;
  cogs: number;
  gross: number;
  expenses: number;
  net: number;
  margin: number;
}

export type ChangeKind = "up" | "down" | "flat" | "new";

export interface MetricChange {
  kind: ChangeKind;
  label: string;
}

export interface TrendPoint {
  label: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface RankedProduct {
  name: string;
  revenue: number;
  units: number;
}

export interface SlowProduct {
  name: string;
  quantity: number;
  tiedUp: number;
}

export interface CapitalSnapshot {
  invested: number;
  stockValue: number;
  cashCollected: number;
  outstandingCredit: number;
}

export interface BusinessInsight {
  tone: "good" | "bad";
  text: string;
}

export interface FinancialOverview {
  noun: string;
  current: PeriodFigures;
  changes: Record<keyof PeriodFigures, MetricChange>;
  insight: BusinessInsight;
  trend: TrendPoint[];
  topProducts: RankedProduct[];
  slowStock: SlowProduct[];
  capital: CapitalSnapshot;
}

export interface FinanceRecords {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  purchases: Purchase[];
  payments: Payment[];
  credits: CreditLedgerEntry[];
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function periodWindows(period: FinancePeriod, today = new Date()): {
  current: PeriodWindow;
  previous: PeriodWindow;
  noun: string;
} {
  if (period === "monthly") {
    const start = startOfMonth(today);
    const previous = subMonths(start, 1);
    return {
      current: { from: dayKey(start), to: dayKey(endOfMonth(today)) },
      previous: { from: dayKey(previous), to: dayKey(endOfMonth(previous)) },
      noun: "month",
    };
  }
  if (period === "yearly") {
    const year = today.getFullYear();
    return {
      current: { from: `${year}-01-01`, to: `${year}-12-31` },
      previous: { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
      noun: "year",
    };
  }
  const year = today.getFullYear();
  if (today.getMonth() < 6) {
    return {
      current: { from: `${year}-01-01`, to: `${year}-06-30` },
      previous: { from: `${year - 1}-07-01`, to: `${year - 1}-12-31` },
      noun: "half-year",
    };
  }
  return {
    current: { from: `${year}-07-01`, to: `${year}-12-31` },
    previous: { from: `${year}-01-01`, to: `${year}-06-30` },
    noun: "half-year",
  };
}

export function periodFigures(
  sales: Sale[],
  products: Product[],
  expenses: Expense[],
  window: PeriodWindow,
): PeriodFigures {
  const summary = summarizeSales(sales, products, window.from, window.to);
  const expenseTotal = expenses
    .filter((expense) => inDateRange(expense.date, window.from, window.to))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const gross = summary.revenue - summary.cost;
  const net = gross - expenseTotal;
  return {
    revenue: summary.revenue,
    cogs: summary.cost,
    gross,
    expenses: expenseTotal,
    net,
    margin: summary.revenue === 0 ? 0 : (net / summary.revenue) * 100,
  };
}

export function compareMetric(current: number, previous: number): MetricChange {
  if (previous === 0 && current === 0) return { kind: "flat", label: "No change" };
  if (previous === 0) return { kind: current > 0 ? "up" : "down", label: "New" };
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  if (percent === 0) return { kind: "flat", label: "No change" };
  const kind: ChangeKind = percent > 0 ? "up" : "down";
  return { kind, label: `${Math.abs(percent).toFixed(1)}%` };
}

function insightFor(current: PeriodFigures, previous: PeriodFigures, noun: string): BusinessInsight {
  if (current.net < 0) {
    return {
      tone: "bad",
      text: `You're currently operating at a loss this ${noun} — expenses exceeded revenue by ${formatPKR(Math.abs(current.net))}.`,
    };
  }
  if (current.revenue > 0 && current.margin > previous.margin) {
    return {
      tone: "good",
      text: `Your profit margin improved to ${current.margin.toFixed(1)}% this ${noun}, up from ${previous.margin.toFixed(1)}%.`,
    };
  }
  const change = compareMetric(current.net, previous.net);
  if (change.kind === "down") {
    return {
      tone: "good",
      text: `You're profitable this ${noun} — net profit is down ${change.label} compared to last ${noun}.`,
    };
  }
  if (change.label === "New" || change.label === "No change") {
    return {
      tone: "good",
      text: `You're profitable this ${noun} — net profit is ${formatPKR(current.net)}.`,
    };
  }
  return {
    tone: "good",
    text: `You're profitable this ${noun} — net profit is up ${change.label} compared to last ${noun}.`,
  };
}

function twelveMonthTrend(records: FinanceRecords, today: Date): TrendPoint[] {
  const start = startOfMonth(today);
  return Array.from({ length: 12 }, (_, index) => {
    const month = subMonths(start, 11 - index);
    const figures = periodFigures(records.sales, records.products, records.expenses, {
      from: dayKey(month),
      to: dayKey(endOfMonth(month)),
    });
    return {
      label: format(month, "MMM yy"),
      revenue: figures.revenue,
      expenses: figures.expenses,
      net: figures.net,
    };
  });
}

function topProducts(sales: Sale[], window: PeriodWindow): RankedProduct[] {
  const totals = new Map<string, RankedProduct>();
  for (const sale of sales) {
    if (!inDateRange(sale.date, window.from, window.to)) continue;
    for (const item of sale.items) {
      const current = totals.get(item.productId) ?? { name: item.productName, revenue: 0, units: 0 };
      current.revenue += lineTotal(item);
      current.units += item.quantity;
      totals.set(item.productId, current);
    }
  }
  return [...totals.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 5);
}

function slowStock(sales: Sale[], products: Product[], today: Date): SlowProduct[] {
  const from = dayKey(subDays(today, 60));
  const to = dayKey(today);
  const sold = new Set<string>();
  for (const sale of sales) {
    if (!inDateRange(sale.date, from, to)) continue;
    for (const item of sale.items) sold.add(item.productId);
  }
  return products
    .filter((product) => product.quantity > 0 && !sold.has(product.id))
    .map((product) => ({
      name: product.name,
      quantity: product.quantity,
      tiedUp: product.quantity * product.purchaseCost,
    }))
    .sort((a, b) => b.tiedUp - a.tiedUp || a.name.localeCompare(b.name));
}

function capitalSnapshot(records: FinanceRecords): CapitalSnapshot {
  const purchases = records.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const expenses = records.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const cashCollected = records.payments
    .filter((payment) => payment.referenceType === "sale" || payment.referenceType === "credit")
    .reduce((sum, payment) => sum + payment.amount, 0);
  return {
    invested: purchases + expenses,
    stockValue: sumStockValue(records.products),
    cashCollected,
    outstandingCredit: sumOutstandingCredit(records.credits),
  };
}

export function buildFinancialOverview(
  records: FinanceRecords,
  period: FinancePeriod,
  today = new Date(),
): FinancialOverview {
  const windows = periodWindows(period, today);
  const current = periodFigures(records.sales, records.products, records.expenses, windows.current);
  const previous = periodFigures(records.sales, records.products, records.expenses, windows.previous);
  return {
    noun: windows.noun,
    current,
    changes: {
      revenue: compareMetric(current.revenue, previous.revenue),
      cogs: compareMetric(current.cogs, previous.cogs),
      gross: compareMetric(current.gross, previous.gross),
      expenses: compareMetric(current.expenses, previous.expenses),
      net: compareMetric(current.net, previous.net),
      margin: compareMetric(current.margin, previous.margin),
    },
    insight: insightFor(current, previous, windows.noun),
    trend: twelveMonthTrend(records, today),
    topProducts: topProducts(records.sales, windows.current),
    slowStock: slowStock(records.sales, records.products, today),
    capital: capitalSnapshot(records),
  };
}
