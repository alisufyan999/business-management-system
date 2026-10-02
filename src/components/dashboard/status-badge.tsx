import { Badge } from "@/components/ui/badge";
import type { CreditStatus, SaleStatus } from "@/lib/types";

const saleCopy: Record<SaleStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  credit: "Credit",
};

const creditCopy: Record<CreditStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  upcoming: "Due soon",
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  if (status === "paid") return <Badge variant="secondary">{saleCopy[status]}</Badge>;
  if (status === "partial") return <Badge variant="outline">{saleCopy[status]}</Badge>;
  return <Badge variant="destructive">{saleCopy[status]}</Badge>;
}

export function CreditStatusBadge({ status }: { status: CreditStatus }) {
  if (status === "overdue") return <Badge variant="destructive">{creditCopy[status]}</Badge>;
  if (status === "partial") return <Badge variant="outline">{creditCopy[status]}</Badge>;
  if (status === "paid") return <Badge variant="secondary">{creditCopy[status]}</Badge>;
  return <Badge>{creditCopy[status]}</Badge>;
}
