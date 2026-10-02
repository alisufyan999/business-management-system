import { defaultSettings } from "@/lib/settings-defaults";
import type { Product } from "@/lib/types";
import { useSettingsStore } from "@/store/settings.store";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const laptopBrands = ["Dell", "HP", "Lenovo", "Apple", "Asus"] as const;

export const productCategories = [
  "Business",
  "Student",
  "Gaming",
  "Ultrabook",
  "Workstation",
] as const;

export function stockThreshold(product: Product): number {
  if (product.lowStockThreshold !== undefined) return product.lowStockThreshold;
  const fallback = useSettingsStore.getState().settings.defaultLowStockThreshold;
  return Number.isFinite(fallback) ? fallback : defaultSettings.defaultLowStockThreshold;
}

export function stockStatus(product: Product): StockStatus {
  if (product.quantity <= 0) return "out_of_stock";
  if (product.quantity <= stockThreshold(product)) return "low_stock";
  return "in_stock";
}

export function stockStatusLabel(status: StockStatus): string {
  if (status === "out_of_stock") return "Out of Stock";
  if (status === "low_stock") return "Low Stock";
  return "In Stock";
}

export function specSummary(product: Product): string {
  return `${product.specs.ram} / ${product.specs.storage} / ${product.specs.processor}`;
}
