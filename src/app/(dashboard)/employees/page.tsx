import type { Metadata } from "next";
import { EmployeesView } from "@/components/employees/employees-view";

export const metadata: Metadata = {
  title: "Employees",
  description: "Staff records and monthly salary payments.",
};

export default function EmployeesPage() {
  return <EmployeesView />;
}
