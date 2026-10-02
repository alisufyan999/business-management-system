export type PaymentMethod =
  | "cash"
  | "online"
  | "cheque"
  | "pay_order"
  | "credit";

export type CustomerType = "walk_in" | "regular" | "credit";

export type SaleStatus = "paid" | "partial" | "credit";

export type CreditStatus = "paid" | "partial" | "overdue" | "upcoming";

export type EmployeeRole =
  | "Sales Staff"
  | "Technician"
  | "Accountant"
  | "Manager";

export type ExpenseCategory = "rent" | "electricity" | "internet" | "misc" | "salary";

export type EmployeeStatus = "active" | "inactive";

export type LaptopBrand = "Dell" | "HP" | "Lenovo" | "Apple" | "Asus";

export type SupplierPaymentMethod = Exclude<PaymentMethod, "credit">;

export type PurchasePaymentStatus = "paid" | "pending";

export type PaymentReferenceType = "sale" | "credit" | "expense" | "salary";

export interface Product {
  id: string;
  name: string;
  brand: LaptopBrand;
  model: string;
  specs: {
    ram: string;
    storage: string;
    processor: string;
    other?: string;
  };
  purchaseCost: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  category: string;
  dateAdded: string;
}

export type DiscountType = "percent" | "fixed";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: CustomerType;
  email?: string;
  address?: string;
  city?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  amount: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  employeeId: string;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  paymentMethod?: SupplierPaymentMethod;
  paymentStatus?: PurchasePaymentStatus;
  dueDate?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  monthlySalary: number;
  joinDate: string;
  phone: string;
  email?: string;
  status?: EmployeeStatus;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  paidOn: string;
  method: Exclude<PaymentMethod, "credit">;
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  referenceType: PaymentReferenceType;
  referenceId: string;
  partyName: string;
  notes?: string;
}

export interface CreditLedgerEntry {
  id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: CreditStatus;
  createdAt: string;
  paidDate?: string;
}

export const billPartyKinds = ["customer", "vendor", "dealer", "walk_in", "other"] as const;

export type BillPartyKind = (typeof billPartyKinds)[number];

export interface BillLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Bill {
  id: string;
  number: string;
  date: string;
  partyKind: BillPartyKind;
  partyName: string;
  partyPhone?: string;
  partyAddress?: string;
  lines: BillLine[];
  discountValue: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: Exclude<PaymentMethod, "credit">;
  salaryPaymentId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface Session {
  isAuthenticated: boolean;
  user: User | null;
  rememberMe: boolean;
}
