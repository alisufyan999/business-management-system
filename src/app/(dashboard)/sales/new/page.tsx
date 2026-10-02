import type { Metadata } from "next";
import { PosView } from "@/components/sales/pos-view";

export const metadata: Metadata = {
  title: "New sale",
  description: "Record a sale, take payment, and update stock.",
};

export default function NewSalePage() {
  return <PosView />;
}
