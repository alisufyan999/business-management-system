"use client";

import { format } from "date-fns";
import { Plus, Printer, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { SearchableSelect, type SearchOption } from "@/components/catalog/searchable-select";
import { InvoicePaper } from "@/components/invoices/invoice-paper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPaymentMethod } from "@/lib/format";
import {
  billPartyKindLabels,
  createInvoiceNumber,
  downloadInvoiceFile,
  invoicePageStyle,
} from "@/lib/invoice-document";
import { billDraftSchema } from "@/lib/schemas/bill";
import * as billsService from "@/lib/services/bills.service";
import * as customersService from "@/lib/services/customers.service";
import * as settingsService from "@/lib/services/settings.service";
import * as suppliersService from "@/lib/services/suppliers.service";
import type { AppSettings } from "@/lib/settings-defaults";
import { defaultSettings } from "@/lib/settings-defaults";
import { billPartyKinds, type BillPartyKind, type Customer, type PaymentMethod, type Supplier } from "@/lib/types";

const methods: PaymentMethod[] = ["cash", "online", "cheque", "pay_order", "credit"];

interface DraftLine {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

function blankLine(): DraftLine {
  return { key: Math.random().toString(36).slice(2, 8), description: "", quantity: "1", unitPrice: "" };
}

function readAmount(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function readRequired(value: string): number {
  if (value.trim() === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function InvoiceComposer() {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [number] = useState(() => createInvoiceNumber(today));
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [date, setDate] = useState(today);
  const [partyKind, setPartyKind] = useState<BillPartyKind>("customer");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice ${number}`,
    pageStyle: invoicePageStyle,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([settingsService.getSettings(), customersService.getAll(), suppliersService.getAll()])
      .then(([nextSettings, nextCustomers, nextSuppliers]) => {
        if (cancelled) return;
        setSettings(nextSettings);
        setCustomers(nextCustomers);
        setSuppliers(nextSuppliers);
      })
      .catch(() => {
        if (!cancelled) setError("Company details could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewLines = lines
    .filter((line) => line.description.trim() || line.unitPrice.trim())
    .map((line) => ({
      description: line.description.trim() || "Item",
      quantity: readRequired(line.quantity) > 0 ? readRequired(line.quantity) : 0,
      unitPrice: readAmount(line.unitPrice),
    }));

  const partyOptions: SearchOption[] =
    partyKind === "vendor"
      ? suppliers.map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
          description: supplier.city,
        }))
      : partyKind === "customer"
        ? customers.map((customer) => ({
            value: customer.id,
            label: customer.name,
            description: customer.phone,
          }))
        : [];

  function applyParty(id: string) {
    if (partyKind === "vendor") {
      const supplier = suppliers.find((item) => item.id === id);
      if (!supplier) return;
      setPartyName(supplier.name);
      setPartyPhone(supplier.phone);
      setPartyAddress([supplier.address, supplier.city].filter(Boolean).join(", "));
      return;
    }
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;
    setPartyName(customer.name);
    setPartyPhone(customer.phone ?? "");
    setPartyAddress([customer.address, customer.city].filter(Boolean).join(", "));
  }

  function draftValues() {
    const filled = lines.filter((line) => line.description.trim() || line.quantity.trim() || line.unitPrice.trim());
    const parsed = billDraftSchema.safeParse({
      date,
      partyKind,
      partyName,
      partyPhone,
      partyAddress,
      notes,
      discountValue: readAmount(discount),
      amountPaid: readAmount(amountPaid),
      paymentMethod,
      lines: filled.map((line) => ({
        description: line.description,
        quantity: readRequired(line.quantity),
        unitPrice: readRequired(line.unitPrice),
      })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the invoice");
      return null;
    }
    setError(null);
    return parsed.data;
  }

  function printInvoice() {
    if (!draftValues()) return;
    handlePrint();
  }

  async function saveInvoice() {
    const value = draftValues();
    if (!value || !printRef.current) return;
    setSaving(true);
    try {
      const bill = await billsService.create({
        number,
        date: value.date,
        partyKind: value.partyKind,
        partyName: value.partyName,
        partyPhone: value.partyPhone,
        partyAddress: value.partyAddress,
        notes: value.notes,
        discountValue: value.discountValue,
        amountPaid: value.amountPaid,
        paymentMethod: value.paymentMethod,
        lines: value.lines,
      });
      downloadInvoiceFile(printRef.current, `Invoice-${bill.number}.html`);
      toast.success("Invoice saved on this computer");
      router.push(`/invoices/${bill.id}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the invoice.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bill a customer, vendor, dealer, walk-in, or someone who is not on file. {number}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={printInvoice} disabled={saving}>
            <Printer />
            Print
          </Button>
          <Button type="button" onClick={() => void saveInvoice()} disabled={saving}>
            <Save />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Bill details</CardTitle>
          <CardDescription>Save downloads the invoice file. Print sends it straight to the printer.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice-date">Date</Label>
              <Input id="invoice-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Who is this for</Label>
              <Select value={partyKind} onValueChange={(value) => setPartyKind((value ?? "customer") as BillPartyKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Party" />
                </SelectTrigger>
                <SelectContent>
                  {billPartyKinds.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {billPartyKindLabels[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {partyOptions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>{partyKind === "vendor" ? "Choose a vendor" : "Choose a customer"}</Label>
              <SearchableSelect
                value=""
                onChange={applyParty}
                options={partyOptions}
                placeholder="Optional — or type the name below"
                searchPlaceholder="Search"
                emptyLabel="No match"
              />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="party-name">Name</Label>
              <Input id="party-name" value={partyName} onChange={(event) => setPartyName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="party-phone">Phone</Label>
              <Input id="party-phone" value={partyPhone} onChange={(event) => setPartyPhone(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="party-address">Address</Label>
              <Input id="party-address" value={partyAddress} onChange={(event) => setPartyAddress(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <div key={line.key} className="grid gap-2 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
                <div className="flex flex-col gap-2">
                  {index === 0 ? <Label>Description</Label> : null}
                  <Input
                    value={line.description}
                    placeholder="Item or service"
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item) => (item.key === line.key ? { ...item, description: event.target.value } : item)),
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {index === 0 ? <Label>Qty</Label> : null}
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item) => (item.key === line.key ? { ...item, quantity: event.target.value } : item)),
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {index === 0 ? <Label>Rate</Label> : null}
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={line.unitPrice}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item) => (item.key === line.key ? { ...item, unitPrice: event.target.value } : item)),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={lines.length === 1}
                  onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-fit" onClick={() => setLines((current) => [...current, blankLine()])}>
              <Plus />
              Add line
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" min={0} value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="received">Amount received</Label>
              <Input id="received" type="number" min={0} value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod((value ?? "cash") as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {formatPaymentMethod(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice-notes">Note</Label>
            <Textarea id="invoice-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
      <div className="overflow-x-auto">
        <InvoicePaper
          paperRef={printRef}
          number={number}
          date={date || today}
          partyKind={billPartyKindLabels[partyKind]}
          partyName={partyName}
          partyPhone={partyPhone}
          partyAddress={partyAddress}
          lines={previewLines}
          discount={readAmount(discount) || 0}
          amountPaid={readAmount(amountPaid) || 0}
          paymentMethod={formatPaymentMethod(paymentMethod)}
          notes={notes}
          settings={settings}
        />
      </div>
    </div>
  );
}
