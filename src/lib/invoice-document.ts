import type { BillLine, BillPartyKind } from "@/lib/types";

export const invoicePageStyle = "@page { size: A4; margin: 12mm; }";

export const billPartyKindLabels: Record<BillPartyKind, string> = {
  customer: "Customer",
  vendor: "Vendor",
  dealer: "Dealer",
  walk_in: "Walk-in",
  other: "Not registered",
};

export function createInvoiceNumber(date: string): string {
  const stamp = date.replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${stamp}-${suffix}`;
}

export function billMath(lines: BillLine[], discountValue: number, amountPaid: number) {
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const discount = Math.min(subtotal, Math.max(0, Math.round(discountValue)));
  const total = Math.max(0, subtotal - discount);
  const paid = Math.min(total, Math.max(0, Math.round(amountPaid)));
  return { subtotal, discount, total, paid, balance: total - paid };
}

export function formatQty(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
}

export function businessInitials(name: string): string {
  const letters = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter((letter): letter is string => Boolean(letter))
    .slice(0, 2);
  return letters.join("").toUpperCase() || "ST";
}

export const invoiceCss = `
  .invoice-root { color: #0f172a; }
  .sheet {
    width: 100%;
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
  .band { height: 8px; background: linear-gradient(90deg, #0f766e, #14b8a6); }
  .head, .body, .foot { padding-left: 32px; padding-right: 32px; }
  .head { display: flex; justify-content: space-between; gap: 24px; padding-top: 28px; padding-bottom: 20px; }
  .brand-row { display: flex; align-items: center; gap: 12px; }
  .mark {
    width: 46px; height: 46px; border-radius: 12px; background: #0f766e; color: #ffffff;
    display: flex; align-items: center; justify-content: center; font-weight: 700; letter-spacing: 0.04em;
  }
  .brand { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .quiet { margin: 2px 0 0; color: #64748b; font-size: 13px; line-height: 1.45; }
  .doc { text-align: right; }
  .kicker { margin: 0; color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: 0.22em; }
  .doc-no { margin: 4px 0 0; font-size: 20px; font-weight: 700; }
  .meta { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 16px; padding-bottom: 8px; }
  .panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
  .label { margin: 0; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .who { margin: 6px 0 0; font-size: 16px; font-weight: 700; }
  .kind {
    display: inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 999px;
    background: #ccfbf1; color: #0f766e; font-size: 12px; font-weight: 600;
  }
  .status { display: inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .status-paid { background: #ecfdf5; color: #047857; }
  .status-partial { background: #fffbeb; color: #b45309; }
  .status-due { background: #fef2f2; color: #b91c1c; }
  .table-wrap { padding: 18px 32px 0; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: 700;
  }
  td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { width: 280px; margin: 18px 32px 0 auto; display: grid; gap: 8px; font-size: 14px; }
  .row { display: flex; justify-content: space-between; gap: 16px; }
  .muted { color: #64748b; }
  .grand { background: #f0fdfa; border-radius: 10px; padding: 10px 12px; font-weight: 700; font-size: 16px; }
  .notes { margin: 18px 32px 0; font-size: 13px; color: #334155; }
  .signs { display: flex; justify-content: space-between; gap: 24px; margin-top: 48px; }
  .sign { width: 180px; border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center; color: #64748b; font-size: 12px; }
  .thanks { margin: 28px 0 0; text-align: center; color: #64748b; font-size: 13px; }
  .foot { padding-bottom: 28px; }
  @media (max-width: 720px) {
    .head, .meta { display: block; }
    .doc { text-align: left; margin-top: 16px; }
    .totals { width: auto; }
  }
  @media print {
    .sheet { border: 0; border-radius: 0; }
    .sheet, .sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function downloadInvoiceFile(node: HTMLElement, filename: string): void {
  const safeName = filename.replace(/[^\w.-]+/g, "-");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safeName}</title><style>body{margin:24px;background:#f8fafc}${invoiceCss}@media print{body{margin:0;background:#fff}}</style></head><body>${node.outerHTML}</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName.endsWith(".html") ? safeName : `${safeName}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
