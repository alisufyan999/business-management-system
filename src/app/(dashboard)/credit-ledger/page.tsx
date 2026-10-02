import type { Metadata } from "next";
import { CreditLedgerView } from "@/components/credit/credit-ledger-view";

export const metadata: Metadata = {
  title: "Credit Ledger",
  description: "Outstanding customer balances and repayments.",
};

export default function CreditLedgerPage() {
  return <CreditLedgerView />;
}
