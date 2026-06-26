import { z } from "zod";
import { QuoteStatusSchema } from "./enums";

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  unit_price: z.number().nonnegative(),
  currency: z.string().length(3),
  tax_rate: z.number().min(0).max(100),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.pick({
  name: true,
  description: true,
  unit_price: true,
  currency: true,
  tax_rate: true,
  active: true,
}).partial({ description: true, active: true });
export type CreateProduct = z.infer<typeof CreateProductSchema>;

export const LineItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(100),
  total: z.number().nonnegative(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const QuoteSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  company_id: z.string().uuid(),
  status: QuoteStatusSchema,
  current_version: z.number().int().positive(),
  created_by: z.string().uuid(),
  valid_until: z.string().date().nullable(),
  deleted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const CreateQuoteSchema = QuoteSchema.pick({
  deal_id: true,
  company_id: true,
  valid_until: true,
}).partial({ valid_until: true });
export type CreateQuote = z.infer<typeof CreateQuoteSchema>;

export const QuoteVersionSchema = z.object({
  id: z.string().uuid(),
  quote_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  line_items: z.array(LineItemSchema),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.string().length(3),
  pdf_path: z.string().nullable(),
  is_current: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type QuoteVersion = z.infer<typeof QuoteVersionSchema>;

export const QuoteApprovalSchema = z.object({
  id: z.string().uuid(),
  quote_version_id: z.string().uuid(),
  magic_link_token: z.string(),
  approved_by_name: z.string().nullable(),
  approved_by_email: z.string().email().nullable(),
  signature_data: z.string().nullable(),
  approved_at: z.string().datetime().nullable(),
  ip_address: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type QuoteApproval = z.infer<typeof QuoteApprovalSchema>;
