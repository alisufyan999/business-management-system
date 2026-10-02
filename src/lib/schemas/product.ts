import { z } from "zod";
import { laptopBrands, productCategories } from "@/lib/stock";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.enum(laptopBrands, { error: "Select a brand" }),
  category: z.enum(productCategories, { error: "Select a category" }),
  ram: z.string().trim().min(1, "RAM is required"),
  storage: z.string().trim().min(1, "Storage is required"),
  processor: z.string().trim().min(1, "Processor is required"),
  otherSpecs: z.string().trim(),
  purchaseCost: z.number({ error: "Enter a purchase cost" }).positive("Purchase cost must be greater than 0"),
  sellingPrice: z.number({ error: "Enter a selling price" }).positive("Selling price must be greater than 0"),
  quantity: z.number({ error: "Enter a quantity" }).int("Quantity must be a whole number").nonnegative("Quantity cannot be negative"),
  lowStockThreshold: z
    .number({ error: "Enter a threshold" })
    .int("Threshold must be a whole number")
    .nonnegative("Threshold cannot be negative"),
  dateAdded: z.string().min(1, "Date added is required"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
