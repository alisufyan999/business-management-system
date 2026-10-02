import type { Metadata } from "next";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Supplier contacts used on purchases.",
};

export default function SuppliersPage() {
  return <SuppliersView />;
}
