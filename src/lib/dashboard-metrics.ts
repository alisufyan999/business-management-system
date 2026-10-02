import { eachDayOfInterval, format, subDays } from "date-fns";
import { formatPaymentMethod } from "@/lib/format";
import type {
  CreditLedgerEntry,
  PaymentMethod,
  Product,
  Sale,
} from "@/lib/types";

export interface DailySalesPoint {
  date: string;
  label: string;
  total: number;
}

export interface PaymentSlice {
  method: PaymentMethod;
  label: string;
  total: number;
}

const methodOrder: PaymentMethod[] = [
  "cash",
  "online",
  "cheque",
  "pay_order",
  "credit",
];

export function todayKey(today = new Date()): string {
  return format(today, "yyyy-MM-dd");
}

export function sumTodaySales(sales: Sale[], today = new Date()): number {
  const key = todayKey(today);
  return sales
    .filter((sale) => sale.date === key)
    .reduce((sum, sale) => sum + sale.amount, 0);
}

export function sumStockValue(products: Product[]): number {
  return products.reduce(
    (sum, product) => sum + product.purchaseCost * product.quantity,
    0,
  );
}

export function sumOutstandingCredit(entries: CreditLedgerEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (entry.status === "paid" || entry.amountPaid >= entry.amount) {
      return sum;
    }
    return sum + (entry.amount - entry.amountPaid);
  }, 0);
}

export function salesLast30Days(sales: Sale[], today = new Date()): DailySalesPoint[] {
  const start = subDays(today, 29);
  const totals = new Map<string, number>();
  for (const sale of sales) {
    totals.set(sale.date, (totals.get(sale.date) ?? 0) + sale.amount);
  }
  return eachDayOfInterval({ start, end: today }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      label: format(day, "d MMM"),
      total: totals.get(date) ?? 0,
    };
  });
}

export function paymentMethodBreakdown(sales: Sale[]): PaymentSlice[] {
  const totals = new Map<PaymentMethod, number>();
  for (const method of methodOrder) {
    totals.set(method, 0);
  }
  for (const sale of sales) {
    totals.set(sale.paymentMethod, (totals.get(sale.paymentMethod) ?? 0) + sale.amount);
  }
  return methodOrder.map((method) => ({
    method,
    label: formatPaymentMethod(method),
    total: totals.get(method) ?? 0,
  }));
}

export function recentSales(sales: Sale[], count = 10): Sale[] {
  return [...sales]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, count);
}

export function lowStockProducts(products: Product[]): Product[] {
  return products
    .filter((product) => product.quantity <= product.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
}

export function pendingCreditEntries(entries: CreditLedgerEntry[]): CreditLedgerEntry[] {
  return entries
    .filter((entry) => entry.status !== "paid")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.customerName.localeCompare(b.customerName));
}
