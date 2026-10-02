import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleStatusBadge } from "@/components/dashboard/status-badge";
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import type { Sale } from "@/lib/types";

export function RecentSalesTable({ sales }: { sales: Sale[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent sales</CardTitle>
        <CardDescription>Last 10 transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDisplayDate(sale.date)}</TableCell>
                  <TableCell className="font-medium">{sale.customerName}</TableCell>
                  <TableCell className="text-right">
                    {sale.items.reduce((count, item) => count + item.quantity, 0)}
                  </TableCell>
                  <TableCell className="text-right">{formatPKR(sale.amount)}</TableCell>
                  <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                  <TableCell>
                    <SaleStatusBadge status={sale.status} />
                  </TableCell>
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
