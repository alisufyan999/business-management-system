import type { Metadata } from "next";
import { PurchasesView } from "@/components/purchases/purchases-view";

export const metadata: Metadata = {
  title: "Purchases",
  description: "Supplier purchases and the stock they add.",
};

export default function PurchasesPage() {
  return <PurchasesView />;
}
