import type { Metadata } from "next";
import { PaymentsView } from "@/components/payments/payments-view";

export const metadata: Metadata = {
  title: "Payments",
  description: "Sale payments and credit repayments.",
};

export default function PaymentsPage() {
  return <PaymentsView />;
}
