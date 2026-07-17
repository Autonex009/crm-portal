import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "sales", "account_manager", "client"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LeadStatusSchema = z.enum([
  "new", 
  "initial count", 
  "deck sent", 
  "not interested", 
  "call scheduled", 
  "call done", 
  "proposal sent", 
  "closed"
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const DealStageSchema = z.enum(["prospect", "proposal", "negotiation", "won", "lost"]);
export type DealStage = z.infer<typeof DealStageSchema>;

export const ActivityTypeSchema = z.enum(["note", "call", "email", "meeting", "system"]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const QuoteStatusSchema = z.enum(["draft", "sent", "approved", "rejected", "expired"]);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const InvoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue", "void"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const PaymentStatusSchema = z.enum(["pending", "succeeded", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const FollowUpChannelSchema = z.enum(["email", "slack"]);
export type FollowUpChannel = z.infer<typeof FollowUpChannelSchema>;

export const FollowUpStatusSchema = z.enum(["pending", "sent", "cancelled"]);
export type FollowUpStatus = z.infer<typeof FollowUpStatusSchema>;

export const IntegrationProviderSchema = z.enum(["google", "slack"]);
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;

export const EntityTypeSchema = z.enum([
  "company",
  "contact",
  "lead",
  "deal",
  "quote",
  "invoice",
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;
