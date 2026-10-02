"use client";

import { useRef } from "react";
import Link from "next/link";
import { Printer, Save } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { LoadError, LoadingRows } from "@/components/catalog/page-states";
import { InvoicePaper } from "@/components/invoices/invoice-paper";
import { Button } from "@/components/ui/button";
import { useEntityList } from "@/hooks/use-entity-list";
import { formatPaymentMethod } from "@/lib/format";
import { downloadInvoiceFile, invoicePageStyle } from "@/lib/invoice-document";
import { discountAmount } from "@/lib/sale-fields";
import type { AppSettings } from "@/lib/settings-defaults";
import * as customersService from "@/lib/services/customers.service";
import * as salesService from "@/lib/services/sales.service";
import * as settingsService from "@/lib/services/settings.service";
import type { Customer, Sale } from "@/lib/types";

export function InvoiceView({ saleId }: { saleId: string }) {
  const { data, error, loading, reload } = useEntityList(async () => {
    const [sale, settings] = await Promise.all([salesService.getById(saleId), settingsService.getSettings()]);
    if (!sale) return { sale: null, customer: null as Customer | null, settings };
    const customer = await customersService.getById(sale.customerId);
    return { sale, customer, settings };
  });

  if (loading) return <LoadingRows />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data?.sale) {
    return <LoadError message="This invoice could not be found." onRetry={reload} />;
  }

  return <SaleInvoiceDocument sale={data.sale} customer={data.customer} settings={data.settings} />;
}

function SaleInvoiceDocument({
  sale,
  customer,
  settings,
}: {
  sale: Sale;
  customer: Customer | null;
  settings: AppSettings;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice ${sale.id}`,
    pageStyle: invoicePageStyle,
  });
  const subtotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = discountAmount(subtotal, sale.discountType, sale.discountValue);
  const partyKind = customer?.type === "walk_in" ? "Walk-in" : "Customer";
  const address = [customer?.address, customer?.city].filter(Boolean).join(", ");

  function save() {
    if (!printRef.current) return;
    downloadInvoiceFile(printRef.current, `Invoice-${sale.id}.html`);
    toast.success("Invoice saved on this computer");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/sales">Back to Sales</Link>
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => handlePrint()}>
            <Printer />
            Print
          </Button>
          <Button type="button" onClick={save}>
            <Save />
            Save
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <InvoicePaper
          paperRef={printRef}
          number={sale.id}
          date={sale.date}
          partyKind={partyKind}
          partyName={sale.customerName}
          partyPhone={customer?.phone}
          partyAddress={address || undefined}
          lines={sale.items.map((item) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))}
          discount={discount}
          amountPaid={sale.amountPaid}
          paymentMethod={formatPaymentMethod(sale.paymentMethod)}
          notes={sale.notes}
          settings={settings}
        />
      </div>
    </div>
  );
}
