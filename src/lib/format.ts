import { format, parseISO } from "date-fns";
import { defaultSettings } from "@/lib/settings-defaults";
import type { PaymentMethod } from "@/lib/types";
import { useSettingsStore } from "@/store/settings.store";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  online: "Online",
  cheque: "Cheque",
  pay_order: "Pay Order",
  credit: "Credit",
};

function currencySymbol(): string {
  const symbol = useSettingsStore.getState().settings.currencySymbol.trim();
  return symbol.length > 0 ? symbol : defaultSettings.currencySymbol;
}

export function formatPKR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${currencySymbol()} ${formatted}`;
}

export function formatPKRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const symbol = currencySymbol();
  if (abs >= 100_000) {
    return `${symbol} ${(amount / 100_000).toFixed(1)}L`;
  }
  if (abs >= 1_000) {
    return `${symbol} ${Math.round(amount / 1_000)}k`;
  }
  return formatPKR(amount);
}

export function formatPaymentMethod(method: PaymentMethod): string {
  return paymentMethodLabels[method];
}

export function formatDisplayDate(isoDate: string): string {
  const pattern = useSettingsStore.getState().settings.dateFormat || defaultSettings.dateFormat;
  return format(parseISO(isoDate), pattern);
}

export function paymentMethodLabelMap(): Record<PaymentMethod, string> {
  return paymentMethodLabels;
}
