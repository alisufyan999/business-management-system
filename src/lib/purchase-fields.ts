import type {
  Purchase,
  PurchasePaymentStatus,
  Supplier,
  SupplierPaymentMethod,
} from "@/lib/types";

export function purchasePaymentMethod(purchase: Purchase): SupplierPaymentMethod {
  return purchase.paymentMethod ?? "cash";
}

export function purchasePaymentStatus(purchase: Purchase): PurchasePaymentStatus {
  return purchase.paymentStatus ?? "paid";
}

export function supplierAddress(supplier: Supplier): string {
  const address = supplier.address?.trim();
  return address && address.length > 0 ? address : supplier.city;
}

export function suggestUnitCost(productId: string, purchases: Purchase[], fallback: number): number {
  const latest = purchases
    .filter((purchase) => purchase.productId === productId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
  return latest?.unitCost ?? fallback;
}
