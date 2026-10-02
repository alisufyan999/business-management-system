import { DEMO_CREDENTIALS } from "@/lib/auth";

export const dateFormats = ["dd MMM yyyy", "dd/MM/yyyy", "yyyy-MM-dd"] as const;

export type DateFormat = (typeof dateFormats)[number];

export interface AppSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  invoiceFooter: string;
  defaultLowStockThreshold: number;
  currencySymbol: string;
  dateFormat: DateFormat;
  password: string;
}

export const defaultSettings: AppSettings = {
  businessName: "Skyline Technologies",
  address: "Clifton Block 5, Karachi",
  phone: "042-111-000-000",
  email: DEMO_CREDENTIALS.email,
  invoiceFooter: "Thank you for your business",
  defaultLowStockThreshold: 5,
  currencySymbol: "Rs.",
  dateFormat: "dd MMM yyyy",
  password: DEMO_CREDENTIALS.password,
};
