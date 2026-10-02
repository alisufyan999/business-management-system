import { z } from "zod";

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  productId: z.string().min(1, "Select a product"),
  quantity: z.number({ error: "Enter a quantity" }).int("Quantity must be a whole number").positive("Quantity must be at least 1"),
  unitCost: z.number({ error: "Enter a unit cost" }).positive("Unit cost must be greater than 0"),
  date: z.string().min(1, "Purchase date is required"),
  paymentMethod: z.enum(["cash", "online", "cheque", "pay_order"], { error: "Select a payment method" }),
  paymentStatus: z.enum(["paid", "pending"], { error: "Select a payment status" }),
  dueDate: z.string(),
  notes: z.string().trim(),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
