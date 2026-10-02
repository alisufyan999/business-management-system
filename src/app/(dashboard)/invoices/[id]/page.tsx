import type { Metadata } from "next";
import { SavedInvoice } from "@/components/invoices/saved-invoice";

export const metadata: Metadata = {
  title: "Invoice",
  description: "Saved invoice ready to print or download.",
};

export default async function InvoiceBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SavedInvoice billId={id} />;
}
