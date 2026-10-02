import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    error: "Enter a valid email",
  });

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["Manager", "Accountant", "Sales Staff", "Technician"], { error: "Select a role" }),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: optionalEmail,
  monthlySalary: z.number({ error: "Enter a salary" }).positive("Salary must be greater than 0"),
  joinDate: z.string().min(1, "Join date is required"),
  status: z.enum(["active", "inactive"], { error: "Select a status" }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const salaryPaymentSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Select a month"),
  amount: z.number({ error: "Enter an amount" }).positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  method: z.enum(["cash", "online", "cheque", "pay_order"], { error: "Select a payment method" }),
  notes: z.string(),
});

export type SalaryPaymentFormValues = z.infer<typeof salaryPaymentSchema>;
