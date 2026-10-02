import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { paymentMethodBreakdown, type DailySalesPoint, type PaymentSlice } from "@/lib/dashboard-metrics";
import { discountAmount, saleBalance, saleSubtotal, todayKey } from "@/lib/sale-fields";
import { stockStatus } from "@/lib/stock";
import type { CreditLedgerEntry, Expense, Product, Sale, SaleItem } from "@/lib/types";

export function saleDiscount(sale: Sale): number {
  return discountAmount(saleSubtotal(sale.items), sale.discountType, sale.discountValue);
}

export function lineCost(item: SaleItem, products: Product[]): number {
  const unit = item.unitCost ?? products.find((product) => product.id === item.productId)?.purchaseCost ?? 0;
  return unit * item.quantity;
}

export function saleCost(sale: Sale, products: Product[]): number {
  return sale.items.reduce((sum, item) => sum + lineCost(item, products), 0);
}

export function inDateRange(date: string, from: string, to: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export interface SalesSummary {
  revenue: number;
  discount: number;
  cost: number;
  profit: number;
  sales: Sale[];
  series: DailySalesPoint[];
  methods: PaymentSlice[];
}

export function summarizeSales(sales: Sale[], products: Product[], from: string, to: string): SalesSummary {
  const filtered = sales
    .filter((sale) => inDateRange(sale.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const revenue = filtered.reduce((sum, sale) => sum + sale.amount, 0);
  const discount = filtered.reduce((sum, sale) => sum + saleDiscount(sale), 0);
  const cost = filtered.reduce((sum, sale) => sum + saleCost(sale, products), 0);
  return {
    revenue,
    discount,
    cost,
    profit: revenue - cost,
    sales: filtered,
    series: dailyTotals(filtered, from, to),
    methods: paymentMethodBreakdown(filtered),
  };
}

function dailyTotals(sales: Sale[], from: string, to: string): DailySalesPoint[] {
  if (!from || !to || from > to) return [];
  const totals = new Map<string, number>();
  for (const sale of sales) {
    totals.set(sale.date, (totals.get(sale.date) ?? 0) + sale.amount);
  }
  return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return { date, label: format(day, "d MMM"), total: totals.get(date) ?? 0 };
  });
}

export interface ProfitAndLoss {
  revenue: number;
  cost: number;
  expenses: number;
  net: number;
}

export function profitAndLoss(
  sales: Sale[],
  products: Product[],
  expenses: Expense[],
  from: string,
  to: string,
): ProfitAndLoss {
  const summary = summarizeSales(sales, products, from, to);
  const expenseTotal = expenses
    .filter((expense) => inDateRange(expense.date, from, to))
    .reduce((sum, expense) => sum + expense.amount, 0);
  return {
    revenue: summary.revenue,
    cost: summary.cost,
    expenses: expenseTotal,
    net: summary.revenue - summary.cost - expenseTotal,
  };
}

export function unitsSold(sales: Sale[], from: string, to: string): number {
  return sales
    .filter((sale) => inDateRange(sale.date, from, to))
    .reduce((sum, sale) => sum + sale.items.reduce((lineSum, item) => lineSum + item.quantity, 0), 0);
}

export type AgingBucket = "current" | "d1_30" | "d31_60" | "d61";

export function agingBucket(entry: CreditLedgerEntry, today = todayKey()): AgingBucket | null {
  if (entry.status === "paid" || entry.amountPaid >= entry.amount) return null;
  const days = differenceInCalendarDays(parseISO(today), parseISO(entry.dueDate));
  if (days <= 0) return "current";
  if (days <= 30) return "d1_30";
  if (days <= 60) return "d31_60";
  return "d61";
}

export interface AgingRow {
  customerId: string;
  customerName: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61: number;
  total: number;
}

export interface CreditAging {
  rows: AgingRow[];
  totals: Omit<AgingRow, "customerId" | "customerName">;
}

const emptyBuckets = { current: 0, d1_30: 0, d31_60: 0, d61: 0, total: 0 };

export function creditAging(entries: CreditLedgerEntry[], today = todayKey()): CreditAging {
  const byCustomer = new Map<string, AgingRow>();
  for (const entry of entries) {
    const bucket = agingBucket(entry, today);
    if (!bucket) continue;
    const remaining = saleBalance(entry.amount, entry.amountPaid);
    const row = byCustomer.get(entry.customerId) ?? {
      customerId: entry.customerId,
      customerName: entry.customerName,
      ...emptyBuckets,
    };
    row[bucket] += remaining;
    row.total += remaining;
    byCustomer.set(entry.customerId, row);
  }
  const rows = [...byCustomer.values()].sort((a, b) => b.total - a.total || a.customerName.localeCompare(b.customerName));
  const totals = rows.reduce(
    (sum, row) => ({
      current: sum.current + row.current,
      d1_30: sum.d1_30 + row.d1_30,
      d31_60: sum.d31_60 + row.d31_60,
      d61: sum.d61 + row.d61,
      total: sum.total + row.total,
    }),
    { ...emptyBuckets },
  );
  return { rows, totals };
}

export function stockRows(products: Product[]) {
  return products
    .map((product) => ({
      product,
      status: stockStatus(product),
      value: product.quantity * product.purchaseCost,
    }))
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
}
