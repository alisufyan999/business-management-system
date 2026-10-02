import { format } from "date-fns";
import {
  creditLedger,
  customers,
  employees,
  expenses,
  payments,
  products,
  purchases,
  salaryPayments,
  sales,
  suppliers,
} from "@/lib/mock-data";
import { useCreditStore } from "@/store/credit.store";
import { useCustomersStore } from "@/store/customers.store";
import { useEmployeesStore } from "@/store/employees.store";
import { useExpensesStore } from "@/store/expenses.store";
import { waitForHydration } from "@/store/hydrate";
import { usePaymentsStore } from "@/store/payments.store";
import { useProductsStore } from "@/store/products.store";
import { usePurchasesStore } from "@/store/purchases.store";
import { useSalesStore } from "@/store/sales.store";
import { useSuppliersStore } from "@/store/suppliers.store";

const DATA_DAY_KEY = "evernew-data-day";

let pending: Promise<void> | null = null;

async function reseedIfNeeded(): Promise<void> {
  await Promise.all([
    waitForHydration(useProductsStore),
    waitForHydration(useCustomersStore),
    waitForHydration(useSuppliersStore),
    waitForHydration(useEmployeesStore),
    waitForHydration(useSalesStore),
    waitForHydration(usePurchasesStore),
    waitForHydration(usePaymentsStore),
    waitForHydration(useCreditStore),
    waitForHydration(useExpensesStore),
  ]);

  if (typeof window === "undefined") return;

  const today = format(new Date(), "yyyy-MM-dd");
  if (window.localStorage.getItem(DATA_DAY_KEY) === today) return;

  useProductsStore.setState({ items: products });
  useCustomersStore.setState({ items: customers });
  useSuppliersStore.setState({ items: suppliers });
  useEmployeesStore.setState({ employees, salaryPayments });
  useSalesStore.setState({ items: sales });
  usePurchasesStore.setState({ items: purchases });
  usePaymentsStore.setState({ items: payments });
  useCreditStore.setState({ items: creditLedger });
  useExpensesStore.setState({ items: expenses });
  window.localStorage.setItem(DATA_DAY_KEY, today);
}

export function ensureDemoDay(): Promise<void> {
  if (!pending) {
    pending = reseedIfNeeded().catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}
