import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type {
  CreditLedgerEntry,
  CreditStatus,
  DiscountType,
  PaymentMethod,
  SaleItem,
  SaleStatus,
} from "@/lib/types";

export function todayKey(today = new Date()): string {
  return format(today, "yyyy-MM-dd");
}

export function lineTotal(item: Pick<SaleItem, "quantity" | "unitPrice">): number {
  return item.quantity * item.unitPrice;
}

export function saleSubtotal(items: Pick<SaleItem, "quantity" | "unitPrice">[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function discountAmount(
  subtotal: number,
  type?: DiscountType,
  value?: number,
): number {
  if (!type || value === undefined || value <= 0 || subtotal <= 0) return 0;
  if (type === "percent") {
    return Math.min(subtotal, Math.round(subtotal * (value / 100)));
  }
  return Math.min(subtotal, Math.round(value));
}

export function grandTotal(
  subtotal: number,
  type?: DiscountType,
  value?: number,
): number {
  return Math.max(0, subtotal - discountAmount(subtotal, type, value));
}

export function saleBalance(amount: number, amountPaid: number): number {
  return Math.max(0, amount - amountPaid);
}

export function saleStatus(
  method: PaymentMethod,
  amount: number,
  amountPaid: number,
): SaleStatus {
  if (amountPaid >= amount) return "paid";
  if (method === "credit" && amountPaid === 0) return "credit";
  return "partial";
}

export function creditStatus(
  amount: number,
  amountPaid: number,
  dueDate: string,
  today = todayKey(),
): CreditStatus {
  if (amountPaid >= amount) return "paid";
  if (dueDate < today) return "overdue";
  if (amountPaid > 0) return "partial";
  return "upcoming";
}

export type LedgerDisplayStatus = "paid" | "due_today" | "overdue" | "upcoming";

export function ledgerDisplayStatus(
  entry: Pick<CreditLedgerEntry, "amount" | "amountPaid" | "dueDate" | "status">,
  today = todayKey(),
): LedgerDisplayStatus {
  if (entry.status === "paid" || entry.amountPaid >= entry.amount) return "paid";
  if (entry.dueDate === today) return "due_today";
  if (entry.dueDate < today) return "overdue";
  return "upcoming";
}

export function daysOverdue(dueDate: string, today = todayKey()): number {
  return Math.max(0, differenceInCalendarDays(parseISO(today), parseISO(dueDate)));
}

export function ledgerStatusLabel(status: LedgerDisplayStatus, dueDate?: string, today = todayKey()): string {
  if (status === "paid") return "Paid";
  if (status === "due_today") return "Due today";
  if (status === "overdue") {
    if (!dueDate) return "Overdue";
    const days = daysOverdue(dueDate, today);
    return days === 1 ? "1 day overdue" : `${days} days overdue`;
  }
  return "Upcoming";
}

export function sortLedgerEntries(entries: CreditLedgerEntry[], today = todayKey()): CreditLedgerEntry[] {
  return [...entries].sort((a, b) => {
    const aOverdue = ledgerDisplayStatus(a, today) === "overdue";
    const bOverdue = ledgerDisplayStatus(b, today) === "overdue";
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate) || a.customerName.localeCompare(b.customerName);
  });
}

export function overdueAmount(entries: CreditLedgerEntry[], today = todayKey()): number {
  return entries.reduce((sum, entry) => {
    if (ledgerDisplayStatus(entry, today) !== "overdue") return sum;
    return sum + saleBalance(entry.amount, entry.amountPaid);
  }, 0);
}

export function openCreditCustomerCount(entries: CreditLedgerEntry[]): number {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (saleBalance(entry.amount, entry.amountPaid) > 0) ids.add(entry.customerId);
  }
  return ids.size;
}

export function outstandingBalance(entries: CreditLedgerEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (entry.status === "paid" || entry.amountPaid >= entry.amount) return sum;
    return sum + (entry.amount - entry.amountPaid);
  }, 0);
}

export const saleStatusLabel: Record<SaleStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  credit: "Credit",
};

export const creditStatusLabel: Record<CreditStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  upcoming: "Upcoming",
};

export const customerTypeLabel = {
  walk_in: "Walk-in",
  regular: "Regular",
  credit: "Credit Customer",
} as const;
