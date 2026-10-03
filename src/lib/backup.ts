import { format } from "date-fns";
import type { AppSettings } from "@/lib/settings-defaults";
import type {
  Bill,
  CreditLedgerEntry,
  Customer,
  Employee,
  Expense,
  Payment,
  Product,
  Purchase,
  SalaryPayment,
  Sale,
  Supplier,
} from "@/lib/types";

export const BACKUP_SCHEMA_VERSION = 1;

export const KEEP_DATA_KEY = "evernew-keep-data";

export const BACKUP_BANNER_KEY = "evernew-backup-banner-dismissed";

const collectionKeys = [
  "products",
  "suppliers",
  "purchases",
  "customers",
  "sales",
  "creditLedger",
  "payments",
  "employees",
  "salaryPayments",
  "expenses",
  "bills",
] as const;

export interface AppBackup {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  customers: Customer[];
  sales: Sale[];
  creditLedger: CreditLedgerEntry[];
  payments: Payment[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  expenses: Expense[];
  bills: Bill[];
  settings: AppSettings;
}

export function backupFilename(today = new Date()): string {
  return `evernew-backup-${format(today, "yyyy-MM-dd")}.json`;
}

export function markUserDataKept(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEEP_DATA_KEY, "1");
}

export function downloadBackupFile(backup: AppBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseBackup(value: unknown): AppBackup | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== BACKUP_SCHEMA_VERSION) return null;
  if (typeof record.exportedAt !== "string" || record.exportedAt.length === 0) return null;
  if (!collectionKeys.every((key) => Array.isArray(record[key]))) return null;
  if (!record.settings || typeof record.settings !== "object" || Array.isArray(record.settings)) return null;
  return record as unknown as AppBackup;
}
