"use client";

import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { Download } from "lucide-react";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { PaymentChart } from "@/components/dashboard/payment-chart";
import { AgingChart } from "@/components/reports/aging-chart";
import { RangeChart } from "@/components/reports/range-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityList } from "@/hooks/use-entity-list";
import { downloadCsv } from "@/lib/csv";
import { sumStockValue } from "@/lib/dashboard-metrics";
import { formatPaymentMethod, formatPKR } from "@/lib/format";
import {
  creditAging,
  profitAndLoss,
  saleDiscount,
  stockRows,
  summarizeSales,
  unitsSold,
} from "@/lib/reports";
import { saleStatusLabel, todayKey } from "@/lib/sale-fields";
import { stockStatusLabel } from "@/lib/stock";
import * as creditService from "@/lib/services/credit.service";
import * as expensesService from "@/lib/services/expenses.service";
import * as productsService from "@/lib/services/products.service";
import * as salesService from "@/lib/services/sales.service";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ReportsView() {
  const { data, error, loading, reload } = useEntityList(async () => {
    const [sales, products, expenses, credits] = await Promise.all([
      salesService.getAll(),
      productsService.getAll(),
      expensesService.getAll(),
      creditService.getAll(),
    ]);
    return { sales, products, expenses, credits };
  });
  const [from, setFrom] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => todayKey());

  const sales = data?.sales ?? [];
  const products = data?.products ?? [];
  const expenses = data?.expenses ?? [];
  const credits = data?.credits ?? [];
  const summary = summarizeSales(sales, products, from, to);
  const pnl = profitAndLoss(sales, products, expenses, from, to);
  const sold = unitsSold(sales, from, to);
  const stock = stockRows(products);
  const low = stock.filter((row) => row.status === "low_stock");
  const out = stock.filter((row) => row.status === "out_of_stock");
  const aging = creditAging(credits);
  const agingBars = [
    { label: "Current", total: aging.totals.current },
    { label: "1-30 days", total: aging.totals.d1_30 },
    { label: "31-60 days", total: aging.totals.d31_60 },
    { label: "60+ days", total: aging.totals.d61 },
  ];

  function exportSales() {
    downloadCsv(
      "sales-report.csv",
      ["Date", "Invoice#", "Customer", "Total", "Discount", "Payment Method", "Status"],
      summary.sales.map((sale) => [
        sale.date,
        sale.id,
        sale.customerName,
        sale.amount,
        saleDiscount(sale),
        formatPaymentMethod(sale.paymentMethod),
        saleStatusLabel[sale.status],
      ]),
    );
  }

  function exportStock() {
    downloadCsv(
      "stock-report.csv",
      ["Product", "Brand", "Quantity", "Purchase Cost", "Stock Value", "Status"],
      stock.map((row) => [
        row.product.name,
        row.product.brand,
        row.product.quantity,
        row.product.purchaseCost,
        row.value,
        stockStatusLabel(row.status),
      ]),
    );
  }

  function exportAging() {
    downloadCsv(
      "credit-aging.csv",
      ["Customer", "Current", "1-30 Days", "31-60 Days", "60+ Days", "Total"],
      aging.rows.map((row) => [row.customerName, row.current, row.d1_30, row.d31_60, row.d61, row.total]),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader title="Reports" description="Sales, profit, stock, and credit aging from the live records." />
      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error ? (
        <Tabs defaultValue="sales">
          <TabsList className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="pnl">Profit & loss</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="credit">Credit aging</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
              <Button type="button" variant="outline" onClick={exportSales}>
                <Download />
                Export CSV
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Sales revenue" value={formatPKR(summary.revenue)} />
              <SummaryCard label="Discount given" value={formatPKR(summary.discount)} />
              <SummaryCard label="Profit" value={formatPKR(summary.profit)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <RangeChart data={summary.series} />
              <PaymentChart data={summary.methods} title="Payment methods" description="Share of invoice value in this range" />
            </div>
          </TabsContent>

          <TabsContent value="pnl" className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
            </div>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Profit and loss</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>Revenue</span>
                  <span className="font-medium">{formatPKR(pnl.revenue)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Cost of goods sold</span>
                  <span className="font-medium">{formatPKR(pnl.cost)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Expenses</span>
                  <span className="font-medium">{formatPKR(pnl.expenses)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-3 text-base font-semibold">
                  <span>Net profit</span>
                  <span>{formatPKR(pnl.net)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
              <Button type="button" variant="outline" onClick={exportStock}>
                <Download />
                Export CSV
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Stock value" value={formatPKR(sumStockValue(products))} />
              <SummaryCard label="Units sold in range" value={String(sold)} />
            </div>
            <StockList title="Low stock" rows={low} empty="Nothing is low on stock." />
            <StockList title="Out of stock" rows={out} empty="Nothing is out of stock." />
          </TabsContent>

          <TabsContent value="credit" className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={exportAging}>
                <Download />
                Export CSV
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Current" value={formatPKR(aging.totals.current)} />
              <SummaryCard label="1-30 days overdue" value={formatPKR(aging.totals.d1_30)} />
              <SummaryCard label="31-60 days overdue" value={formatPKR(aging.totals.d31_60)} />
              <SummaryCard label="60+ days overdue" value={formatPKR(aging.totals.d61)} />
            </div>
            <AgingChart data={agingBars} />
            {aging.rows.length === 0 ? (
              <EmptyState title="No open credit" description="Outstanding balances will be grouped by how late they are." />
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>1-30 days</TableHead>
                      <TableHead>31-60 days</TableHead>
                      <TableHead>60+ days</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aging.rows.map((row) => (
                      <TableRow key={row.customerId}>
                        <TableCell className="font-medium">{row.customerName}</TableCell>
                        <TableCell>{formatPKR(row.current)}</TableCell>
                        <TableCell>{formatPKR(row.d1_30)}</TableCell>
                        <TableCell>{formatPKR(row.d31_60)}</TableCell>
                        <TableCell>{formatPKR(row.d61)}</TableCell>
                        <TableCell className="font-medium">{formatPKR(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function StockList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ReturnType<typeof stockRows>;
  empty: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.product.id}>
                    <TableCell className="font-medium">{row.product.name}</TableCell>
                    <TableCell>{row.product.quantity}</TableCell>
                    <TableCell>{formatPKR(row.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
