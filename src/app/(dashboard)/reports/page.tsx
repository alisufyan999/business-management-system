import type { Metadata } from "next";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = {
  title: "Reports",
  description: "Sales, profit and loss, stock, and credit aging for Skyline Technologies.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
