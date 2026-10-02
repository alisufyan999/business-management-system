import { billMath } from "@/lib/invoice-document";
import { apiCall, createId, notFound } from "@/lib/services/api";
import { useBillsStore } from "@/store/bills.store";
import type { Bill } from "@/lib/types";

export type NewBill = Omit<Bill, "id">;

export function getAll(): Promise<Bill[]> {
  // TODO: replace with real API call
  return apiCall(useBillsStore, () => useBillsStore.getState().items);
}

export function getById(id: string): Promise<Bill | null> {
  // TODO: replace with real API call
  return apiCall(useBillsStore, () => useBillsStore.getState().items.find((item) => item.id === id) ?? null);
}

export function create(input: NewBill): Promise<Bill> {
  // TODO: replace with real API call
  return apiCall(useBillsStore, () => {
    const totals = billMath(input.lines, input.discountValue, input.amountPaid);
    if (input.lines.length === 0) throw new Error("Add at least one line");
    if (input.partyName.trim().length === 0) throw new Error("Enter who this bill is for");
    if (input.discountValue > totals.subtotal) throw new Error("Discount cannot be more than the subtotal");
    if (input.amountPaid > totals.total) throw new Error("Amount received cannot be more than the total");
    const bill: Bill = {
      ...input,
      id: createId("inv"),
      partyName: input.partyName.trim(),
      partyPhone: input.partyPhone?.trim() || undefined,
      partyAddress: input.partyAddress?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      discountValue: totals.discount,
      amountPaid: totals.paid,
      lines: input.lines.map((line) => ({
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    };
    useBillsStore.getState().add(bill);
    return bill;
  });
}

export function removeBill(id: string): Promise<void> {
  // TODO: replace with real API call
  return apiCall(useBillsStore, () => {
    const current = useBillsStore.getState().items.find((item) => item.id === id);
    if (!current) throw notFound("Invoice", id);
    useBillsStore.getState().remove(id);
  });
}
