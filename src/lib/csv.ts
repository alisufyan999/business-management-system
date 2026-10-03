import { format } from "date-fns";

export function csvExportFilename(prefix: string, today = new Date()): string {
  return `${prefix}-export-${format(today, "yyyy-MM-dd")}.csv`;
}

function escapeCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const body = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
