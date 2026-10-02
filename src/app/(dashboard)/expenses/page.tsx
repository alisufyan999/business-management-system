import type { Metadata } from "next";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = {
  title: "Expenses",
  description: "Operating costs, including salaries paid to staff.",
};

export default function ExpensesPage() {
  return <ExpensesView />;
}
