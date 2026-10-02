import { z } from "zod";
import { billMath } from "@/lib/invoice-document";
import { billPartyKinds } from "@/lib/types";

const lineSchema = z.object({
  description: z.string().trim().min(1, { error: "Each line needs a description" }),
  quantity: z.number({ error: "Enter a quantity" }).positive({ error: "Quantity must be greater than zero" }),
  unitPrice: z.number({ error: "Enter a unit price" }).min(0, { error: "Unit price cannot be negative" }),
});

export const billDraftSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a date" }),
    partyKind: z.enum(billPartyKinds),
    partyName: z.string().trim().min(1, { error: "Enter who this bill is for" }),
    partyPhone: z.string().trim(),
    partyAddress: z.string().trim(),
    notes: z.string().trim(),
    discountValue: z.number({ error: "Enter a discount" }).min(0, { error: "Discount cannot be negative" }),
    amountPaid: z.number({ error: "Enter the amount received" }).min(0, { error: "Amount received cannot be negative" }),
    paymentMethod: z.enum(["cash", "online", "cheque", "pay_order", "credit"]),
    lines: z.array(lineSchema).min(1, { error: "Add at least one line" }),
  })
  .superRefine((value, ctx) => {
    const totals = billMath(value.lines, value.discountValue, value.amountPaid);
    if (value.discountValue > totals.subtotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Discount cannot be more than the subtotal",
      });
    }
    if (value.amountPaid > totals.total) {
      ctx.addIssue({
        code: "custom",
        path: ["amountPaid"],
        message: "Amount received cannot be more than the total",
      });
    }
  });

export type BillDraft = z.infer<typeof billDraftSchema>;
