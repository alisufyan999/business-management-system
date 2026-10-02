import type { RefObject } from "react";
import { formatDisplayDate, formatPKR } from "@/lib/format";
import {
  billMath,
  businessInitials,
  formatQty,
  invoiceCss,
} from "@/lib/invoice-document";
import type { AppSettings } from "@/lib/settings-defaults";
import type { BillLine } from "@/lib/types";

export function InvoicePaper({
  paperRef,
  number,
  date,
  partyKind,
  partyName,
  partyPhone,
  partyAddress,
  lines,
  discount,
  amountPaid,
  paymentMethod,
  notes,
  settings,
}: {
  paperRef: RefObject<HTMLDivElement | null>;
  number: string;
  date: string;
  partyKind: string;
  partyName: string;
  partyPhone?: string;
  partyAddress?: string;
  lines: BillLine[];
  discount: number;
  amountPaid: number;
  paymentMethod: string;
  notes?: string;
  settings: AppSettings;
}) {
  const totals = billMath(lines, discount, amountPaid);
  const status = totals.balance === 0 ? "paid" : totals.paid > 0 ? "partial" : "due";
  const statusLabel = status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid";

  return (
    <div ref={paperRef} className="invoice-root min-w-[680px]">
      <style>{invoiceCss}</style>
      <article className="sheet">
        <div className="band" />
        <header className="head">
          <div className="brand-row">
            <div className="mark">{businessInitials(settings.businessName)}</div>
            <div>
              <h1 className="brand">{settings.businessName}</h1>
              <p className="quiet">{settings.address}</p>
              <p className="quiet">
                {settings.phone}
                {settings.email ? ` · ${settings.email}` : ""}
              </p>
            </div>
          </div>
          <div className="doc">
            <p className="kicker">INVOICE</p>
            <p className="doc-no">{number}</p>
            <p className="quiet">{/^\d{4}-\d{2}-\d{2}$/.test(date) ? formatDisplayDate(date) : "—"}</p>
          </div>
        </header>
        <section className="body meta">
          <div className="panel">
            <p className="label">Bill to</p>
            <p className="who">{partyName || "Bill recipient"}</p>
            <span className="kind">{partyKind}</span>
            {partyPhone ? <p className="quiet">{partyPhone}</p> : null}
            {partyAddress ? <p className="quiet">{partyAddress}</p> : null}
          </div>
          <div className="panel">
            <p className="label">Payment</p>
            <p className="who">{paymentMethod}</p>
            <span className={`status status-${status}`}>{statusLabel}</span>
            <p className="quiet">Received {formatPKR(totals.paid)}</p>
          </div>
        </section>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th className="num">Qty</th>
                <th className="num">Rate</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Line items appear here
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr key={`${line.description}-${index}`}>
                    <td>{line.description || "Item"}</td>
                    <td className="num">{formatQty(line.quantity)}</td>
                    <td className="num">{formatPKR(line.unitPrice)}</td>
                    <td className="num">{formatPKR(Math.round(line.quantity * line.unitPrice))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="totals">
          <div className="row">
            <span className="muted">Subtotal</span>
            <span>{formatPKR(totals.subtotal)}</span>
          </div>
          <div className="row">
            <span className="muted">Discount</span>
            <span>{formatPKR(totals.discount)}</span>
          </div>
          <div className="row grand">
            <span>Total</span>
            <span>{formatPKR(totals.total)}</span>
          </div>
          <div className="row">
            <span className="muted">Amount received</span>
            <span>{formatPKR(totals.paid)}</span>
          </div>
          <div className="row">
            <span>Balance due</span>
            <span>{formatPKR(totals.balance)}</span>
          </div>
        </div>
        <footer className="foot">
          {notes ? <p className="notes">Note: {notes}</p> : null}
          <div className="signs">
            <div className="sign">Authorized signature</div>
            <div className="sign">Received by</div>
          </div>
          <p className="thanks">{settings.invoiceFooter}</p>
        </footer>
      </article>
    </div>
  );
}
