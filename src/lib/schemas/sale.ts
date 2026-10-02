import { z } from "zod";
import { discountAmount, grandTotal, saleSubtotal } from "@/lib/sale-fields";

export const saleLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number({ error: "Quantity is required" }).int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number({ error: "Unit price is required" }).positive("Unit price must be greater than 0"),
});

export const saleSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    lines: z.array(saleLineSchema).min(1, "Add at least one product"),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number({ error: "Enter a discount" }).min(0, "Discount cannot be negative"),
    date: z.string().min(1, "Date is required"),
    paymentMethod: z.enum(["cash", "online", "cheque", "pay_order", "credit"], {
      error: "Select a payment method",
    }),
    amountReceived: z.number({ error: "Enter the amount received" }).min(0, "Amount cannot be negative"),
    dueDate: z.string(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "percent" && value.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage cannot exceed 100",
      });
    }
    const subtotal = saleSubtotal(value.lines);
    const total = grandTotal(subtotal, value.discountType, value.discountValue);
    if (total <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Grand total must be greater than 0",
      });
    }
    if (value.amountReceived > total) {
      ctx.addIssue({
        code: "custom",
        path: ["amountReceived"],
        message: "Amount received cannot exceed the grand total",
      });
    }
    if (value.amountReceived < total && value.dueDate.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date is required when a balance remains",
      });
    }
    if (discountAmount(subtotal, value.discountType, value.discountValue) > subtotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Discount cannot exceed the subtotal",
      });
    }
  });

export type SaleFormValues = z.infer<typeof saleSchema>;
