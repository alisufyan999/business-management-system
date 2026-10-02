import { z } from "zod";

export function creditPaymentSchema(maxAmount: number) {
  return z.object({
    amount: z
      .number({ error: "Enter an amount" })
      .positive("Amount must be greater than 0")
      .max(maxAmount, "Amount cannot exceed the remaining balance"),
    method: z.enum(["cash", "online", "cheque", "pay_order"], { error: "Select a payment method" }),
    date: z.string().min(1, "Date is required"),
    notes: z.string(),
  });
}

export type CreditPaymentFormValues = z.infer<ReturnType<typeof creditPaymentSchema>>;
