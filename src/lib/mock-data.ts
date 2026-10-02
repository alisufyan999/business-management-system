import { addDays, format, subDays, subMonths } from "date-fns";
import type {
  CreditLedgerEntry,
  CreditStatus,
  Customer,
  Employee,
  Expense,
  LaptopBrand,
  Payment,
  PaymentMethod,
  Product,
  Purchase,
  SalaryPayment,
  Sale,
  SaleItem,
  SaleStatus,
  Supplier,
} from "@/lib/types";

export interface MockDatabase {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  sales: Sale[];
  purchases: Purchase[];
  creditLedger: CreditLedgerEntry[];
  expenses: Expense[];
  payments: Payment[];
}

interface CatalogItem {
  brand: LaptopBrand;
  model: string;
  ram: string;
  storage: string;
  processor: string;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  category: string;
}

const catalog: CatalogItem[] = [
  { brand: "Dell", model: "Latitude 5440", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i5-1345U", sellingPrice: 185000, quantity: 8, lowStockThreshold: 3, category: "Business" },
  { brand: "Dell", model: "Latitude 7450", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core Ultra 7", sellingPrice: 265000, quantity: 5, lowStockThreshold: 2, category: "Business" },
  { brand: "Dell", model: "Inspiron 15 3530", ram: "8 GB", storage: "512 GB SSD", processor: "Intel Core i5-1335U", sellingPrice: 128000, quantity: 2, lowStockThreshold: 4, category: "Student" },
  { brand: "Dell", model: "XPS 13 9340", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core Ultra 7 155H", sellingPrice: 345000, quantity: 4, lowStockThreshold: 2, category: "Ultrabook" },
  { brand: "Dell", model: "G15 5530", ram: "16 GB", storage: "1 TB SSD", processor: "Intel Core i7-13650HX", sellingPrice: 289000, quantity: 6, lowStockThreshold: 2, category: "Gaming" },
  { brand: "HP", model: "ProBook 450 G10", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i5-1335U", sellingPrice: 172000, quantity: 7, lowStockThreshold: 3, category: "Business" },
  { brand: "HP", model: "EliteBook 840 G10", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i7-1355U", sellingPrice: 248000, quantity: 4, lowStockThreshold: 2, category: "Business" },
  { brand: "HP", model: "Pavilion 15-eg", ram: "8 GB", storage: "512 GB SSD", processor: "Intel Core i5-1335U", sellingPrice: 118000, quantity: 1, lowStockThreshold: 3, category: "Student" },
  { brand: "HP", model: "Victus 15", ram: "16 GB", storage: "512 GB SSD", processor: "AMD Ryzen 5 7535HS", sellingPrice: 198000, quantity: 9, lowStockThreshold: 3, category: "Gaming" },
  { brand: "HP", model: "ZBook Firefly 14 G10", ram: "32 GB", storage: "1 TB SSD", processor: "Intel Core i7-1365U", sellingPrice: 395000, quantity: 3, lowStockThreshold: 1, category: "Workstation" },
  { brand: "Lenovo", model: "ThinkPad E14 Gen 5", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i5-1335U", sellingPrice: 168000, quantity: 10, lowStockThreshold: 3, category: "Business" },
  { brand: "Lenovo", model: "ThinkPad T14 Gen 4", ram: "16 GB", storage: "512 GB SSD", processor: "AMD Ryzen 7 PRO 7840U", sellingPrice: 255000, quantity: 6, lowStockThreshold: 2, category: "Business" },
  { brand: "Lenovo", model: "IdeaPad Slim 3", ram: "8 GB", storage: "512 GB SSD", processor: "AMD Ryzen 5 7520U", sellingPrice: 98000, quantity: 2, lowStockThreshold: 4, category: "Student" },
  { brand: "Lenovo", model: "IdeaPad Gaming 3", ram: "16 GB", storage: "512 GB SSD", processor: "AMD Ryzen 5 7640HS", sellingPrice: 215000, quantity: 5, lowStockThreshold: 2, category: "Gaming" },
  { brand: "Lenovo", model: "Yoga Slim 7", ram: "16 GB", storage: "1 TB SSD", processor: "Intel Core Ultra 5", sellingPrice: 228000, quantity: 4, lowStockThreshold: 2, category: "Ultrabook" },
  { brand: "Lenovo", model: "Legion 5", ram: "16 GB", storage: "1 TB SSD", processor: "AMD Ryzen 7 7735HS", sellingPrice: 312000, quantity: 3, lowStockThreshold: 2, category: "Gaming" },
  { brand: "Apple", model: "MacBook Air 13 M2", ram: "8 GB", storage: "256 GB SSD", processor: "Apple M2", sellingPrice: 275000, quantity: 1, lowStockThreshold: 2, category: "Ultrabook" },
  { brand: "Apple", model: "MacBook Air 13 M3", ram: "16 GB", storage: "512 GB SSD", processor: "Apple M3", sellingPrice: 365000, quantity: 5, lowStockThreshold: 2, category: "Ultrabook" },
  { brand: "Apple", model: "MacBook Air 15 M3", ram: "16 GB", storage: "512 GB SSD", processor: "Apple M3", sellingPrice: 415000, quantity: 3, lowStockThreshold: 1, category: "Ultrabook" },
  { brand: "Apple", model: "MacBook Pro 14 M3", ram: "18 GB", storage: "512 GB SSD", processor: "Apple M3 Pro", sellingPrice: 565000, quantity: 2, lowStockThreshold: 1, category: "Workstation" },
  { brand: "Apple", model: "MacBook Pro 16 M3 Pro", ram: "18 GB", storage: "512 GB SSD", processor: "Apple M3 Pro", sellingPrice: 690000, quantity: 2, lowStockThreshold: 1, category: "Workstation" },
  { brand: "Asus", model: "Vivobook 15 X1504", ram: "8 GB", storage: "512 GB SSD", processor: "Intel Core i5-1235U", sellingPrice: 112000, quantity: 0, lowStockThreshold: 3, category: "Student" },
  { brand: "Asus", model: "Zenbook 14 OLED", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core Ultra 5", sellingPrice: 238000, quantity: 4, lowStockThreshold: 2, category: "Ultrabook" },
  { brand: "Asus", model: "ExpertBook B1", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i5-1335U", sellingPrice: 159000, quantity: 6, lowStockThreshold: 2, category: "Business" },
  { brand: "Asus", model: "TUF Gaming F15", ram: "16 GB", storage: "512 GB SSD", processor: "Intel Core i5-12500H", sellingPrice: 205000, quantity: 7, lowStockThreshold: 2, category: "Gaming" },
  { brand: "Asus", model: "ROG Strix G16", ram: "16 GB", storage: "1 TB SSD", processor: "Intel Core i7-13650HX", sellingPrice: 348000, quantity: 3, lowStockThreshold: 1, category: "Gaming" },
  { brand: "HP", model: "250 G9", ram: "8 GB", storage: "256 GB SSD", processor: "Intel Core i3-1215U", sellingPrice: 86000, quantity: 11, lowStockThreshold: 4, category: "Student" },
  { brand: "Dell", model: "Precision 3581", ram: "32 GB", storage: "1 TB SSD", processor: "Intel Core i7-13800H", sellingPrice: 455000, quantity: 2, lowStockThreshold: 1, category: "Workstation" },
];

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seq(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function deriveSaleStatus(
  method: PaymentMethod,
  amount: number,
  amountPaid: number,
): SaleStatus {
  if (amountPaid >= amount) return "paid";
  if (method === "credit" && amountPaid === 0) return "credit";
  return "partial";
}

function deriveCreditStatus(
  amount: number,
  amountPaid: number,
  dueDate: string,
  today: string,
): CreditStatus {
  if (amountPaid >= amount) return "paid";
  if (dueDate < today) return "overdue";
  if (amountPaid > 0) return "partial";
  return "upcoming";
}

function buildProducts(today: Date): Product[] {
  return catalog.map((item, index) => ({
    id: seq("prd", index + 1),
    name: `${item.brand} ${item.model}`,
    brand: item.brand,
    model: item.model,
    specs: {
      ram: item.ram,
      storage: item.storage,
      processor: item.processor,
    },
    purchaseCost: Math.round(item.sellingPrice * 0.86),
    sellingPrice: item.sellingPrice,
    quantity: item.quantity,
    lowStockThreshold: item.lowStockThreshold,
    category: item.category,
    dateAdded: dayKey(subDays(today, 40 + index * 6)),
  }));
}

function buildCustomers(): Customer[] {
  const rows: Array<Omit<Customer, "id">> = [
    { name: "Ahmed Raza", phone: "03001234567", type: "credit", email: "ahmed.raza@gmail.com", address: "DHA Phase 5", city: "Lahore" },
    { name: "Fatima Noor", phone: "03215550918", type: "credit", email: "fatima.noor@outlook.com", address: "Clifton Block 2", city: "Karachi" },
    { name: "Bilal Hussain", phone: "03334561220", type: "walk_in", city: "Lahore" },
    { name: "Sana Iqbal", phone: "03018442011", type: "regular", email: "sana.iqbal@yahoo.com", address: "F-8 Markaz", city: "Islamabad" },
    { name: "Usman Ali", phone: "03451239876", type: "credit", email: "usman.ali@gmail.com", city: "Faisalabad" },
    { name: "Hira Shah", phone: "03119887765", type: "walk_in", city: "Lahore" },
    { name: "Kamran Siddiqui", phone: "03029881234", type: "credit", email: "kamran.s@evermail.com", city: "Karachi" },
    { name: "Ayesha Butt", phone: "03224455667", type: "regular", city: "Lahore" },
    { name: "Danish Mehmood", phone: "03337890123", type: "walk_in", city: "Rawalpindi" },
    { name: "Zainab Qureshi", phone: "03045551290", type: "credit", email: "zainab.q@gmail.com", address: "Gulberg III", city: "Lahore" },
    { name: "Hamza Tariq", phone: "03125550981", type: "regular", city: "Multan" },
    { name: "Maryam Javed", phone: "03419880021", type: "walk_in", city: "Lahore" },
    { name: "Imran Yousaf", phone: "03017654321", type: "credit", email: "imran.yousaf@gmail.com", city: "Karachi" },
    { name: "Rabia Khan", phone: "03217770045", type: "regular", city: "Islamabad" },
    { name: "Farhan Abbas", phone: "03331112233", type: "walk_in", city: "Lahore" },
    { name: "Nadia Chaudhry", phone: "03096661208", type: "credit", email: "nadia.c@gmail.com", city: "Sialkot" },
    { name: "Omar Farooq", phone: "03146667890", type: "regular", city: "Lahore" },
    { name: "Sobia Anwar", phone: "03452221109", type: "walk_in", city: "Gujranwala" },
  ];
  return rows.map((row, index) => ({ id: seq("cus", index + 1), ...row }));
}

function buildSuppliers(): Supplier[] {
  const rows: Array<Omit<Supplier, "id">> = [
    { name: "Metro Computers", contactName: "Shahid Iqbal", phone: "02134567890", email: "sales@metrocomputers.pk", address: "Shop 12, Techno City", city: "Karachi" },
    { name: "Pak IT Distributors", contactName: "Naveed Akram", phone: "04235881234", email: "orders@pakitdist.com", address: "14 Hall Road", city: "Lahore" },
    { name: "Silicon Hub", contactName: "Faisal Mahmood", phone: "0512345678", email: "hello@siliconhub.pk", address: "Blue Area, F-6", city: "Islamabad" },
    { name: "Apple Authorized PK", contactName: "Sara Qureshi", phone: "042111228833", email: "trade@appleauth.pk", address: "MM Alam Road", city: "Lahore" },
    { name: "TechBazaar Wholesale", contactName: "Adnan Sheikh", phone: "02135889900", email: "desk@techbazaar.pk", address: "Saddar Electronics Market", city: "Karachi" },
    { name: "Northern Systems", contactName: "Waqar Afridi", phone: "0915273344", email: "info@northernsystems.pk", address: "University Road", city: "Peshawar" },
    { name: "Indus Laptop Traders", contactName: "Kashif Rana", phone: "0418782211", email: "buy@induslaptops.pk", address: "D-Ground", city: "Faisalabad" },
  ];
  return rows.map((row, index) => ({ id: seq("sup", index + 1), ...row }));
}

function buildEmployees(today: Date): Employee[] {
  const rows: Array<Omit<Employee, "id" | "joinDate"> & { monthsAgo: number }> = [
    { name: "Hassan Malik", role: "Manager", monthlySalary: 180000, phone: "03008441122", monthsAgo: 38 },
    { name: "Areeba Saleem", role: "Accountant", monthlySalary: 95000, phone: "03215550077", monthsAgo: 26 },
    { name: "Usman Ghani", role: "Sales Staff", monthlySalary: 55000, phone: "03331230098", monthsAgo: 18 },
    { name: "Hina Riaz", role: "Sales Staff", monthlySalary: 52000, phone: "03029880011", monthsAgo: 14 },
    { name: "Junaid Akhtar", role: "Technician", monthlySalary: 60000, phone: "03117776654", monthsAgo: 22 },
    { name: "Saima Naz", role: "Sales Staff", monthlySalary: 50000, phone: "03451112208", monthsAgo: 9 },
    { name: "Tariq Mehmood", role: "Technician", monthlySalary: 62000, phone: "03036667721", monthsAgo: 16 },
    { name: "Bushra Latif", role: "Accountant", monthlySalary: 88000, phone: "03214443390", monthsAgo: 11 },
    { name: "Adeel Khan", role: "Manager", monthlySalary: 150000, phone: "03339881200", monthsAgo: 30 },
  ];
  return rows.map((row, index) => ({
    id: seq("emp", index + 1),
    name: row.name,
    role: row.role,
    monthlySalary: row.monthlySalary,
    phone: row.phone,
    joinDate: dayKey(subMonths(today, row.monthsAgo)),
  }));
}

function buildSalaryPayments(employees: Employee[], today: Date): SalaryPayment[] {
  const payments: SalaryPayment[] = [];
  let index = 1;
  for (let monthsBack = 3; monthsBack >= 1; monthsBack -= 1) {
    const monthDate = subMonths(today, monthsBack);
    const month = format(monthDate, "yyyy-MM");
    const paidOn = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 5), "yyyy-MM-dd");
    for (const employee of employees) {
      payments.push({
        id: seq("slr", index),
        employeeId: employee.id,
        employeeName: employee.name,
        month,
        amount: employee.monthlySalary,
        paidOn,
        method: index % 2 === 0 ? "online" : "cash",
      });
      index += 1;
    }
  }
  return payments;
}

function pickItems(products: Product[], rand: () => number): SaleItem[] {
  const count = rand() > 0.72 ? 2 : 1;
  const used = new Set<string>();
  const items: SaleItem[] = [];
  for (let i = 0; i < count; i += 1) {
    let product = products[Math.floor(rand() * products.length)];
    let guard = 0;
    while (used.has(product.id) && guard < 6) {
      product = products[Math.floor(rand() * products.length)];
      guard += 1;
    }
    used.add(product.id);
    const quantity = rand() > 0.88 ? 2 : 1;
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.sellingPrice,
    });
  }
  return items;
}

function buildSales(
  products: Product[],
  customers: Customer[],
  employees: Employee[],
  today: Date,
  rand: () => number,
): Sale[] {
  const creditCustomers = customers.filter((customer) => customer.type === "credit");
  const otherCustomers = customers.filter((customer) => customer.type !== "credit");
  const salesStaff = employees.filter(
    (employee) => employee.role === "Sales Staff" || employee.role === "Manager",
  );
  const todayPlan: PaymentMethod[] = ["cash", "online", "credit", "cheque"];
  const rest: PaymentMethod[] = [
    ...Array<PaymentMethod>(14).fill("cash"),
    ...Array<PaymentMethod>(9).fill("online"),
    ...Array<PaymentMethod>(5).fill("cheque"),
    ...Array<PaymentMethod>(4).fill("pay_order"),
    ...Array<PaymentMethod>(12).fill("credit"),
  ];
  const planned: Array<{ method: PaymentMethod; daysAgo: number }> = [
    ...todayPlan.map((method) => ({ method, daysAgo: 0 })),
    ...rest.map((method) => ({ method, daysAgo: 1 + Math.floor(rand() * 89) })),
  ];

  return planned.map((plan, index) => {
    const pool = plan.method === "credit" ? creditCustomers : otherCustomers;
    const customer = pool[Math.floor(rand() * pool.length)];
    const employee = salesStaff[Math.floor(rand() * salesStaff.length)];
    const items = pickItems(products, rand);
    const amount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    let amountPaid = amount;
    if (plan.method === "credit") {
      if (plan.daysAgo > 40 && rand() > 0.35) {
        amountPaid = amount;
      } else if (rand() > 0.55) {
        amountPaid = Math.round(amount * (0.25 + rand() * 0.35));
      } else {
        amountPaid = 0;
      }
    }
    return {
      id: seq("sal", index + 1),
      date: dayKey(subDays(today, plan.daysAgo)),
      customerId: customer.id,
      customerName: customer.name,
      items,
      amount,
      amountPaid,
      paymentMethod: plan.method,
      status: deriveSaleStatus(plan.method, amount, amountPaid),
      employeeId: employee.id,
    };
  });
}

function buildCreditLedger(sales: Sale[], today: Date): CreditLedgerEntry[] {
  const todayKeyValue = dayKey(today);
  return sales
    .filter((sale) => sale.paymentMethod === "credit")
    .map((sale, index) => {
      const dueDate = dayKey(addDays(new Date(`${sale.date}T00:00:00`), 21));
      return {
        id: seq("crd", index + 1),
        saleId: sale.id,
        customerId: sale.customerId,
        customerName: sale.customerName,
        amount: sale.amount,
        amountPaid: sale.amountPaid,
        dueDate,
        status: deriveCreditStatus(sale.amount, sale.amountPaid, dueDate, todayKeyValue),
        createdAt: sale.date,
      };
    });
}

function buildPurchases(
  products: Product[],
  suppliers: Supplier[],
  today: Date,
  rand: () => number,
): Purchase[] {
  return Array.from({ length: 12 }, (_, index) => {
    const product = products[Math.floor(rand() * products.length)];
    const supplier =
      product.brand === "Apple"
        ? suppliers.find((item) => item.name === "Apple Authorized PK") ?? suppliers[0]
        : suppliers[Math.floor(rand() * suppliers.length)];
    const quantity = 2 + Math.floor(rand() * 6);
    const unitCost = product.purchaseCost;
    const methods = ["cash", "online", "cheque", "pay_order"] as const;
    const pending = index % 4 === 0;
    const date = dayKey(subDays(today, 5 + Math.floor(rand() * 80)));
    return {
      id: seq("pur", index + 1),
      date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      quantity,
      unitCost,
      total: quantity * unitCost,
      paymentMethod: methods[index % methods.length],
      paymentStatus: pending ? "pending" : "paid",
      dueDate: pending ? dayKey(addDays(today, 10 + index)) : undefined,
      notes: index % 3 === 0 ? "Wholesale batch" : undefined,
    };
  });
}

function buildExpenses(today: Date): Expense[] {
  const rows: Array<Omit<Expense, "id">> = [
    { date: dayKey(subMonths(today, 2)), category: "rent", description: "Shop rent — Clifton, Karachi", amount: 85000, paymentMethod: "online" },
    { date: dayKey(subMonths(today, 1)), category: "rent", description: "Shop rent — Clifton, Karachi", amount: 85000, paymentMethod: "online" },
    { date: dayKey(subDays(today, 3)), category: "rent", description: "Shop rent — Clifton, Karachi", amount: 85000, paymentMethod: "online" },
    { date: dayKey(subDays(today, 50)), category: "electricity", description: "LESCO bill", amount: 22400, paymentMethod: "cash" },
    { date: dayKey(subDays(today, 18)), category: "electricity", description: "LESCO bill", amount: 26850, paymentMethod: "cash" },
    { date: dayKey(subDays(today, 12)), category: "internet", description: "PTCL business fiber", amount: 8000, paymentMethod: "online" },
    { date: dayKey(subDays(today, 40)), category: "internet", description: "PTCL business fiber", amount: 8000, paymentMethod: "online" },
    { date: dayKey(subDays(today, 8)), category: "misc", description: "Packaging and courier", amount: 6400, paymentMethod: "cash" },
    { date: dayKey(subDays(today, 27)), category: "misc", description: "Shop cleaning and tea", amount: 3200, paymentMethod: "cash" },
  ];
  return rows.map((row, index) => ({ id: seq("exp", index + 1), ...row }));
}

function buildPayments(
  sales: Sale[],
  expenses: Expense[],
  salaryPayments: SalaryPayment[],
): Payment[] {
  const payments: Payment[] = [];
  let index = 1;
  for (const sale of sales) {
    if (sale.amountPaid <= 0) continue;
    payments.push({
      id: seq("pay", index),
      date: sale.date,
      amount: sale.amountPaid,
      method: sale.paymentMethod === "credit" ? "cash" : sale.paymentMethod,
      referenceType: sale.paymentMethod === "credit" ? "credit" : "sale",
      referenceId: sale.id,
      partyName: sale.customerName,
      notes: sale.paymentMethod === "credit" ? "Received against credit sale" : undefined,
    });
    index += 1;
  }
  for (const expense of expenses) {
    if (expense.salaryPaymentId) continue;
    payments.push({
      id: seq("pay", index),
      date: expense.date,
      amount: expense.amount,
      method: expense.paymentMethod,
      referenceType: "expense",
      referenceId: expense.id,
      partyName: expense.description,
    });
    index += 1;
  }
  for (const salary of salaryPayments) {
    payments.push({
      id: seq("pay", index),
      date: salary.paidOn,
      amount: salary.amount,
      method: salary.method,
      referenceType: "salary",
      referenceId: salary.id,
      partyName: salary.employeeName,
      notes: `Salary ${salary.month}`,
    });
    index += 1;
  }
  return payments;
}

export function buildMockDatabase(now = new Date()): MockDatabase {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rand = mulberry32(20261002);
  const products = buildProducts(today);
  const customers = buildCustomers();
  const suppliers = buildSuppliers();
  const employees = buildEmployees(today);
  const salaryPayments = buildSalaryPayments(employees, today);
  const sales = buildSales(products, customers, employees, today, rand);
  const creditLedger = buildCreditLedger(sales, today);
  const purchases = buildPurchases(products, suppliers, today, rand);
  const operatingExpenses = buildExpenses(today);
  const expenses = [
    ...operatingExpenses,
    ...salaryPayments.map((salary, index) => ({
      id: seq("exp", operatingExpenses.length + index + 1),
      date: salary.paidOn,
      category: "salary" as const,
      description: `Salary — ${salary.employeeName} (${salary.month})`,
      amount: salary.amount,
      paymentMethod: salary.method,
      salaryPaymentId: salary.id,
    })),
  ];
  const payments = buildPayments(sales, expenses, salaryPayments);
  return {
    products,
    customers,
    suppliers,
    employees,
    salaryPayments,
    sales,
    purchases,
    creditLedger,
    expenses,
    payments,
  };
}

export const mockDatabase = buildMockDatabase();

export const products = mockDatabase.products;
export const customers = mockDatabase.customers;
export const suppliers = mockDatabase.suppliers;
export const employees = mockDatabase.employees;
export const salaryPayments = mockDatabase.salaryPayments;
export const sales = mockDatabase.sales;
export const purchases = mockDatabase.purchases;
export const creditLedger = mockDatabase.creditLedger;
export const expenses = mockDatabase.expenses;
export const payments = mockDatabase.payments;
