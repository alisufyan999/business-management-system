import { apiCall, createId, notFound } from "@/lib/services/api";
import { createCrudService } from "@/lib/services/crud";
import type { Purchase, PurchasePaymentStatus, SupplierPaymentMethod } from "@/lib/types";
import { useProductsStore } from "@/store/products.store";
import { usePurchasesStore } from "@/store/purchases.store";
import { useSuppliersStore } from "@/store/suppliers.store";

const api = createCrudService(usePurchasesStore, "Purchase", "pur");

export const getAll = api.getAll;
export const getById = api.getById;
export const update = api.update;
export const { delete: removePurchase } = api;
export { removePurchase as delete };

export interface CreatePurchaseInput {
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  date: string;
  paymentMethod: SupplierPaymentMethod;
  paymentStatus: PurchasePaymentStatus;
  dueDate?: string;
  notes?: string;
}

export function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  // TODO: replace with real API call
  return apiCall(usePurchasesStore, () => {
    const product = useProductsStore.getState().items.find((item) => item.id === input.productId);
    const supplier = useSuppliersStore.getState().items.find((item) => item.id === input.supplierId);
    if (!product) throw notFound("Product", input.productId);
    if (!supplier) throw notFound("Supplier", input.supplierId);

    const notes = input.notes?.trim();
    const purchase: Purchase = {
      id: createId("pur"),
      date: input.date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      quantity: input.quantity,
      unitCost: input.unitCost,
      total: input.quantity * input.unitCost,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      dueDate: input.paymentStatus === "pending" ? input.dueDate || undefined : undefined,
      notes: notes ? notes : undefined,
    };

    usePurchasesStore.getState().add(purchase);
    useProductsStore.getState().update(product.id, {
      quantity: product.quantity + input.quantity,
      purchaseCost: input.unitCost,
    });
    return purchase;
  });
}
