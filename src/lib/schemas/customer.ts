import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    error: "Enter a valid email",
  });

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: optionalEmail,
  address: z.string().trim(),
  type: z.enum(["walk_in", "regular", "credit"], { error: "Select a customer type" }),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const walkInSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.length >= 7, {
      error: "Enter a valid phone number",
    }),
});

export type WalkInFormValues = z.infer<typeof walkInSchema>;
