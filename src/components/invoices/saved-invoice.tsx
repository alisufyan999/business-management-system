"use client";

import Link from "next/link";
import { Printer, Save } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { LoadError, LoadingRows } from "@/components/catalog/page-states";
import { InvoicePaper } from "@/components/invoices/invoice-paper";
import { Button } from "@/components/ui/button";
import { formatPaymentMethod } from "@/lib/format";
import { billPartyKindLabels, downloadInvoiceFile, invoicePageStyle } from "@/lib/invoice-document";
import * as billsService from "@/lib/services/bills.service";
import * as settingsService from "@/lib/services/settings.service";
import type { AppSettings } from "@/lib/settings-defaults";
import type { Bill } from "@/lib/types";
import { useEntityList } from "@/hooks/use-entity-list";

export function SavedInvoice({ billId }: { billId: string }) {
  const { data, error, loading, reload } = useEntityList(async () => {
    const [bill, settings] = await Promise.all([billsService.getById(billId), settingsService.getSettings()]);
    return { bill, settings };
  });

  if (loading) return <LoadingRows />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data?.bill) return <LoadError message="This invoice could not be found." onRetry={reload} />;

  return <SavedInvoiceDocument bill={data.bill} settings={data.settings} />;
}

function SavedInvoiceDocument({ bill, settings }: { bill: Bill; settings: AppSettings }) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice ${bill.number}`,
    pageStyle: invoicePageStyle,
  });

  function save() {
    if (!printRef.current) return;
    downloadInvoiceFile(printRef.current, `Invoice-${bill.number}.html`);
    toast.success("Invoice saved on this computer");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/invoices">Back to Invoices</Link>
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
          number={bill.number}
          date={bill.date}
          partyKind={billPartyKindLabels[bill.partyKind]}
          partyName={bill.partyName}
          partyPhone={bill.partyPhone}
          partyAddress={bill.partyAddress}
          lines={bill.lines}
          discount={bill.discountValue}
          amountPaid={bill.amountPaid}
          paymentMethod={formatPaymentMethod(bill.paymentMethod)}
          notes={bill.notes}
          settings={settings}
        />
      </div>
    </div>
  );
}
