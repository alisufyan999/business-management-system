import type { Metadata } from "next";
import { InvoiceComposer } from "@/components/invoices/invoice-composer";

export const metadata: Metadata = {
  title: "New invoice",
  description: "Write a bill and save or print it.",
};

export default function NewInvoicePage() {
  return <InvoiceComposer />;
}
