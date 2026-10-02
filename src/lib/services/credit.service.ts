import { apiCall, createId, notFound } from "@/lib/services/api";
import { createCrudService } from "@/lib/services/crud";
import { creditStatus, saleStatus, todayKey } from "@/lib/sale-fields";
import type { CreditLedgerEntry, SupplierPaymentMethod } from "@/lib/types";
import { useCreditStore } from "@/store/credit.store";
import { waitForHydration } from "@/store/hydrate";
import { usePaymentsStore } from "@/store/payments.store";
import { useSalesStore } from "@/store/sales.store";

const api = createCrudService(useCreditStore, "Credit ledger entry", "crd");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removeCreditEntry } = api;
export { removeCreditEntry as delete };

export interface RecordCreditPaymentInput {
  entryId: string;
  amount: number;
  method: SupplierPaymentMethod;
  date: string;
  notes?: string;
}

export async function recordCreditPayment(input: RecordCreditPaymentInput): Promise<CreditLedgerEntry> {
  // TODO: replace with real API call
  await Promise.all([waitForHydration(usePaymentsStore), waitForHydration(useSalesStore)]);

  return apiCall(useCreditStore, () => {
    const entry = useCreditStore.getState().items.find((item) => item.id === input.entryId);
    if (!entry) throw notFound("Credit ledger entry", input.entryId);

    const remaining = entry.amount - entry.amountPaid;
    const amount = Math.round(input.amount);
    if (amount <= 0) throw new Error("Amount must be greater than 0.");
    if (amount > remaining) throw new Error("Amount cannot exceed the remaining balance.");

    const amountPaid = entry.amountPaid + amount;
    const status = creditStatus(entry.amount, amountPaid, entry.dueDate, todayKey());
    const patch: Partial<CreditLedgerEntry> = { amountPaid, status };
    if (amountPaid >= entry.amount) patch.paidDate = input.date;
    useCreditStore.getState().update(entry.id, patch);

    const notes = input.notes?.trim();
    usePaymentsStore.getState().add({
      id: createId("pay"),
      date: input.date,
      amount,
      method: input.method,
      referenceType: "credit",
      referenceId: entry.id,
      partyName: entry.customerName,
      notes: notes ? notes : undefined,
    });

    const sale = useSalesStore.getState().items.find((item) => item.id === entry.saleId);
    if (sale) {
      const salePaid = Math.min(sale.amount, sale.amountPaid + amount);
      useSalesStore.getState().update(sale.id, {
        amountPaid: salePaid,
        status: saleStatus(sale.paymentMethod, sale.amount, salePaid),
      });
    }

    return { ...entry, ...patch };
  });
}
