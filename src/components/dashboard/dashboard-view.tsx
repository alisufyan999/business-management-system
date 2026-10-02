"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { LowStockWidget } from "@/components/dashboard/low-stock";
import { PaymentChart } from "@/components/dashboard/payment-chart";
import { PendingCreditWidget } from "@/components/dashboard/pending-credit";
import { RecentSalesTable } from "@/components/dashboard/recent-sales";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  lowStockProducts,
  paymentMethodBreakdown,
  pendingCreditEntries,
  recentSales,
  salesLast30Days,
  sumOutstandingCredit,
  sumStockValue,
  sumTodaySales,
  type DailySalesPoint,
  type PaymentSlice,
} from "@/lib/dashboard-metrics";
import * as creditService from "@/lib/services/credit.service";
import * as employeesService from "@/lib/services/employees.service";
import * as productsService from "@/lib/services/products.service";
import * as salesService from "@/lib/services/sales.service";
import { useSettingsStore } from "@/store/settings.store";
import type { CreditLedgerEntry, Product, Sale } from "@/lib/types";

interface DashboardData {
  todaySales: number;
  stockValue: number;
  outstandingCredit: number;
  employeeCount: number;
  salesSeries: DailySalesPoint[];
  paymentSlices: PaymentSlice[];
  recent: Sale[];
  lowStock: Product[];
  pendingCredit: CreditLedgerEntry[];
}

async function loadDashboard(): Promise<DashboardData> {
  const [sales, products, credits, employees] = await Promise.all([
    salesService.getAll(),
    productsService.getAll(),
    creditService.getAll(),
    employeesService.getAll(),
  ]);

  return {
    todaySales: sumTodaySales(sales),
    stockValue: sumStockValue(products),
    outstandingCredit: sumOutstandingCredit(credits),
    employeeCount: employees.filter((employee) => employee.status !== "inactive").length,
    salesSeries: salesLast30Days(sales),
    paymentSlices: paymentMethodBreakdown(sales),
    recent: recentSales(sales),
    lowStock: lowStockProducts(products),
    pendingCredit: pendingCreditEntries(credits),
  };
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const businessName = useSettingsStore((state) => state.settings.businessName);

  useEffect(() => {
    let cancelled = false;
    loadDashboard()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load the dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy")} · {businessName}
        </p>
      </div>
      {loading ? <DashboardSkeleton /> : null}
      {!loading && error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReloadKey((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {!loading && data ? (
        <>
          <StatCards
            todaySales={data.todaySales}
            stockValue={data.stockValue}
            outstandingCredit={data.outstandingCredit}
            employeeCount={data.employeeCount}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <SalesChart data={data.salesSeries} />
            <PaymentChart data={data.paymentSlices} />
          </div>
          <RecentSalesTable sales={data.recent} />
          <div className="grid gap-4 lg:grid-cols-2">
            <LowStockWidget products={data.lowStock} />
            <PendingCreditWidget entries={data.pendingCredit} />
          </div>
        </>
      ) : null}
    </div>
  );
}
