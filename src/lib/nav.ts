import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Package,
  FileText,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/credit-ledger", label: "Credit Ledger", icon: BookOpen },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/employees", label: "Employees", icon: BadgeCheck },
  { href: "/expenses", label: "Expenses", icon: Banknote },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
