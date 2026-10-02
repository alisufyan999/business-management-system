import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Supplier name is required"),
  contactName: z.string().trim().min(1, "Contact person is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      error: "Enter a valid email",
    }),
  address: z.string().trim(),
  city: z.string().trim().min(1, "City is required"),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
