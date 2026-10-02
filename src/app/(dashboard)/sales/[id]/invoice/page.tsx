import type { Metadata } from "next";
import { InvoiceView } from "@/components/sales/invoice-view";

export const metadata: Metadata = {
  title: "Invoice",
  description: "Printable invoice for a recorded sale.",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceView saleId={id} />;
}
