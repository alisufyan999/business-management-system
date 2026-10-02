import type { Metadata } from "next";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customer records and what they still owe.",
};

export default function CustomersPage() {
  return <CustomersView />;
}
