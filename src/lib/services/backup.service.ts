import { downloadBackupFile, markUserDataKept, type AppBackup } from "@/lib/backup";
import { ensureDemoDay } from "@/store/reseed";
import { waitForHydration } from "@/store/hydrate";
import { useBillsStore } from "@/store/bills.store";
import { useCreditStore } from "@/store/credit.store";
import { useCustomersStore } from "@/store/customers.store";
import { useEmployeesStore } from "@/store/employees.store";
import { useExpensesStore } from "@/store/expenses.store";
import { usePaymentsStore } from "@/store/payments.store";
import { useProductsStore } from "@/store/products.store";
import { usePurchasesStore } from "@/store/purchases.store";
import { useSalesStore } from "@/store/sales.store";
import { useSettingsStore } from "@/store/settings.store";
import { useSuppliersStore } from "@/store/suppliers.store";

async function hydrateStores(): Promise<void> {
  await Promise.all([
    waitForHydration(useProductsStore),
    waitForHydration(useSuppliersStore),
    waitForHydration(usePurchasesStore),
    waitForHydration(useCustomersStore),
    waitForHydration(useSalesStore),
    waitForHydration(useCreditStore),
    waitForHydration(usePaymentsStore),
    waitForHydration(useEmployeesStore),
    waitForHydration(useExpensesStore),
    waitForHydration(useBillsStore),
    waitForHydration(useSettingsStore),
  ]);
}

export async function exportBackup(): Promise<AppBackup> {
  // TODO: replace this JSON file with a server-side database backup.
  await ensureDemoDay();
  await hydrateStores();
  const exportedAt = new Date().toISOString();
  const backup: AppBackup = {
    schemaVersion: 1,
    exportedAt,
    products: useProductsStore.getState().items,
    suppliers: useSuppliersStore.getState().items,
    purchases: usePurchasesStore.getState().items,
    customers: useCustomersStore.getState().items,
    sales: useSalesStore.getState().items,
    creditLedger: useCreditStore.getState().items,
    payments: usePaymentsStore.getState().items,
    employees: useEmployeesStore.getState().employees,
    salaryPayments: useEmployeesStore.getState().salaryPayments,
    expenses: useExpensesStore.getState().items,
    bills: useBillsStore.getState().items,
    settings: useSettingsStore.getState().settings,
  };
  downloadBackupFile(backup);
  markUserDataKept();
  useSettingsStore.getState().update({ lastBackupAt: exportedAt });
  return backup;
}

export async function restoreBackup(backup: AppBackup): Promise<void> {
  // TODO: replace this JSON restore with a server-side database restore.
  await ensureDemoDay();
  await hydrateStores();
  useProductsStore.setState({ items: backup.products });
  useSuppliersStore.setState({ items: backup.suppliers });
  usePurchasesStore.setState({ items: backup.purchases });
  useCustomersStore.setState({ items: backup.customers });
  useSalesStore.setState({ items: backup.sales });
  useCreditStore.setState({ items: backup.creditLedger });
  usePaymentsStore.setState({ items: backup.payments });
  useEmployeesStore.setState({
    employees: backup.employees,
    salaryPayments: backup.salaryPayments,
  });
  useExpensesStore.setState({ items: backup.expenses });
  useBillsStore.setState({ items: backup.bills });
  useSettingsStore.setState({ settings: backup.settings });
  markUserDataKept();
}
