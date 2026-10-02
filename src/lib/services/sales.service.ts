import { apiCall, createId, notFound } from "@/lib/services/api";
import { createCrudService } from "@/lib/services/crud";
import {
  creditStatus,
  discountAmount,
  grandTotal,
  saleStatus,
  saleSubtotal,
  todayKey,
} from "@/lib/sale-fields";
import type {
  DiscountType,
  PaymentMethod,
  Sale,
  SaleItem,
} from "@/lib/types";
import { useCreditStore } from "@/store/credit.store";
import { useCustomersStore } from "@/store/customers.store";
import { useEmployeesStore } from "@/store/employees.store";
import { waitForHydration, type HydratableStore } from "@/store/hydrate";
import { usePaymentsStore } from "@/store/payments.store";
import { useProductsStore } from "@/store/products.store";
import { useSalesStore } from "@/store/sales.store";

const api = createCrudService(useSalesStore, "Sale", "sal");

export const getAll = api.getAll;
export const getById = api.getById;
export const update = api.update;
export const { delete: removeSale } = api;
export { removeSale as delete };

export interface CreateSaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleInput {
  customerId: string;
  lines: CreateSaleLine[];
  discountType?: DiscountType;
  discountValue?: number;
  date: string;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  dueDate?: string;
  notes?: string;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  // TODO: replace with real API call
  await Promise.all([
    waitForHydration(useProductsStore),
    waitForHydration(usePaymentsStore),
    waitForHydration(useCreditStore),
    waitForHydration(useCustomersStore),
    waitForHydration(useEmployeesStore as unknown as HydratableStore),
  ]);

  return apiCall(useSalesStore, () => {
    const customer = useCustomersStore.getState().items.find((item) => item.id === input.customerId);
    if (!customer) throw notFound("Customer", input.customerId);
    if (input.lines.length === 0) throw new Error("Add at least one product.");

    const requested = new Map<string, number>();
    for (const line of input.lines) {
      if (line.quantity < 1) throw new Error("Quantity must be at least 1.");
      if (line.unitPrice <= 0) throw new Error("Unit price must be greater than 0.");
      requested.set(line.productId, (requested.get(line.productId) ?? 0) + line.quantity);
    }

    const products = useProductsStore.getState();
    const items: SaleItem[] = input.lines.map((line) => {
      const product = products.items.find((item) => item.id === line.productId);
      if (!product) throw notFound("Product", line.productId);
      return {
        productId: product.id,
        productName: product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitCost: product.purchaseCost,
      };
    });

    for (const [productId, quantity] of requested) {
      const product = products.items.find((item) => item.id === productId);
      if (!product) throw notFound("Product", productId);
      if (quantity > product.quantity) {
        throw new Error(`${product.name} only has ${product.quantity} in stock.`);
      }
    }

    const subtotal = saleSubtotal(items);
    const discount = discountAmount(subtotal, input.discountType, input.discountValue);
    const total = grandTotal(subtotal, input.discountType, input.discountValue);
    const received = Math.round(input.amountReceived);
    if (total <= 0) throw new Error("Grand total must be greater than 0.");
    if (received < 0 || received > total) {
      throw new Error("Amount received must be between 0 and the grand total.");
    }
    const balance = total - received;
    const dueDate = input.dueDate?.trim();
    if (balance > 0 && !dueDate) throw new Error("A due date is required when a balance remains.");

    const manager = useEmployeesStore.getState().employees.find((employee) => employee.role === "Manager");
    if (!manager) throw new Error("No manager is available to record this sale.");

    const notes = input.notes?.trim();
    const sale: Sale = {
      id: createId("sal"),
      date: input.date,
      customerId: customer.id,
      customerName: customer.name,
      items,
      amount: total,
      amountPaid: received,
      paymentMethod: input.paymentMethod,
      status: saleStatus(input.paymentMethod, total, received),
      employeeId: manager.id,
      discountType: discount > 0 ? input.discountType : undefined,
      discountValue: discount > 0 ? input.discountValue : undefined,
      notes: notes ? notes : undefined,
    };

    useSalesStore.getState().add(sale);
    for (const [productId, quantity] of requested) {
      const product = products.items.find((item) => item.id === productId);
      if (!product) continue;
      products.update(product.id, { quantity: product.quantity - quantity });
    }

    if (received > 0) {
      usePaymentsStore.getState().add({
        id: createId("pay"),
        date: input.date,
        amount: received,
        method: input.paymentMethod === "credit" ? "cash" : input.paymentMethod,
        referenceType: "sale",
        referenceId: sale.id,
        partyName: customer.name,
        notes: notes ? notes : undefined,
      });
    }

    if (balance > 0 && dueDate) {
      useCreditStore.getState().add({
        id: createId("crd"),
        saleId: sale.id,
        customerId: customer.id,
        customerName: customer.name,
        amount: total,
        amountPaid: received,
        dueDate,
        status: creditStatus(total, received, dueDate, todayKey()),
        createdAt: input.date,
      });
    }

    return sale;
  });
}
