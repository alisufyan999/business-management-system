"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { purchasePaymentMethod, purchasePaymentStatus } from "@/lib/purchase-fields";
import type { Purchase } from "@/lib/types";

export function PurchaseDetail({
  purchase,
  onOpenChange,
}: {
  purchase: Purchase | null;
  onOpenChange: (open: boolean) => void;
}) {
  const status = purchase ? purchasePaymentStatus(purchase) : "paid";

  return (
    <Sheet open={purchase !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {purchase ? (
          <>
            <SheetHeader>
              <SheetTitle>{purchase.productName}</SheetTitle>
              <SheetDescription>{formatDisplayDate(purchase.date)}</SheetDescription>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-3 px-4 pb-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Supplier</dt>
                <dd>{purchase.supplierName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Quantity</dt>
                <dd>{purchase.quantity}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unit cost</dt>
                <dd>{formatPKR(purchase.unitCost)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total cost</dt>
                <dd>{formatPKR(purchase.total)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment method</dt>
                <dd>{formatPaymentMethod(purchasePaymentMethod(purchase))}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment status</dt>
                <dd>
                  <Badge variant={status === "pending" ? "outline" : "secondary"}>
                    {status === "pending" ? "Pending" : "Paid"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Due date</dt>
                <dd>{purchase.dueDate ? formatDisplayDate(purchase.dueDate) : "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd>{purchase.notes?.trim() || "—"}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
