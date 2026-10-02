import { z } from "zod";

export const manualExpenseCategories = ["rent", "electricity", "internet", "misc"] as const;

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum(manualExpenseCategories, { error: "Select a category" }),
  description: z.string().trim().min(1, "Description is required"),
  amount: z.number({ error: "Enter an amount" }).positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "online", "cheque", "pay_order"], { error: "Select a payment method" }),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
