import type { Metadata } from "next";
import { InvoicesView } from "@/components/invoices/invoices-view";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Create, save, and print bills for any customer, vendor, dealer, or walk-in.",
};

export default function InvoicesPage() {
  return <InvoicesView />;
}
