import { z } from "zod";
import { dateFormats } from "@/lib/settings-defaults";

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    error: "Enter a valid email",
  });

export const companySchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  address: z.string().trim().min(1, "Address is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: optionalEmail,
  invoiceFooter: z.string().trim().min(1, "Footer note is required"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const preferencesSchema = z.object({
  defaultLowStockThreshold: z
    .number({ error: "Enter a threshold" })
    .int("Use a whole number")
    .nonnegative("Threshold cannot be negative"),
  currencySymbol: z.string().trim().min(1, "Currency symbol is required").max(8, "Use a short symbol"),
  dateFormat: z.enum(dateFormats, { error: "Select a date format" }),
});

export type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter the current password"),
    nextPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .superRefine((value, ctx) => {
    if (value.nextPassword !== value.confirmPassword) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
