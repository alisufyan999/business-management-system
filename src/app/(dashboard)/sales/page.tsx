import type { Metadata } from "next";
import { SalesView } from "@/components/sales/sales-view";

export const metadata: Metadata = {
  title: "Sales",
  description: "Invoices, balances, and payment status.",
};

export default function SalesPage() {
  return <SalesView />;
}
