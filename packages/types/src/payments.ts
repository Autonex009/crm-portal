import { z } from "zod";
import { InvoiceStatusSchema, PaymentStatusSchema, FollowUpChannelSchema, FollowUpStatusSchema } from "./enums";

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  quote_id: z.string().uuid(),
  company_id: z.string().uuid(),
  invoice_number: z.string().min(1),
  status: InvoiceStatusSchema,
  amount_due: z.number().nonnegative(),
  currency: z.string().length(3),
  due_date: z.string().date().nullable(),
  stripe_invoice_id: z.string().nullable(),
  payment_link: z.string().url().nullable(),
  account_manager_id: z.string().uuid().nullable(),
  deleted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  stripe_payment_intent_id: z.string().nullable(),
  status: PaymentStatusSchema,
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const FollowUpSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  scheduled_for: z.string().datetime(),
  channel: FollowUpChannelSchema,
  status: FollowUpStatusSchema,
  attempt_number: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type FollowUp = z.infer<typeof FollowUpSchema>;
