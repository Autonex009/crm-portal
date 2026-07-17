import { z } from "zod";
import { UserRoleSchema, LeadStatusSchema, DealStageSchema, ActivityTypeSchema, EntityTypeSchema } from "./enums";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(255),
  role: UserRoleSchema,
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  domain: z.string().nullable(),
  industry: z.string().nullable(),
  logo_path: z.string().nullable(),
  owner_id: z.string().uuid(),
  deleted_at: z.string().datetime().nullable(),
  archived_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CreateCompanySchema = CompanySchema.pick({
  name: true,
  domain: true,
  industry: true,
  logo_path: true,
}).partial({ domain: true, industry: true, logo_path: true });
export type CreateCompany = z.infer<typeof CreateCompanySchema>;

export const ContactSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  deleted_at: z.string().datetime().nullable(),
  archived_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const CreateContactSchema = ContactSchema.pick({
  company_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  title: true,
}).partial({ phone: true, title: true });
export type CreateContact = z.infer<typeof CreateContactSchema>;

export const LeadSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  contact_name: z.string().nullable(),
  job_title: z.string().nullable(),
  company_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  product_interest: z.string().nullable(),
  source: z.string().nullable(),
  status: LeadStatusSchema,
  assigned_to: z.string().uuid().nullable(),
  value_estimate: z.number().nonnegative().nullable(),
  next_follow_up_date: z.string().date().nullable(),
  notes: z.string().nullable(),
  deleted_at: z.string().datetime().nullable(),
  archived_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadSchema = LeadSchema.pick({
  title: true,
  contact_name: true,
  job_title: true,
  company_id: true,
  contact_id: true,
  email: true,
  phone: true,
  linkedin_url: true,
  industry: true,
  location: true,
  product_interest: true,
  source: true,
  status: true,
  assigned_to: true,
  value_estimate: true,
  next_follow_up_date: true,
  notes: true,
}).partial({
  title: true, contact_name: true, job_title: true, company_id: true, contact_id: true,
  email: true, phone: true, linkedin_url: true, industry: true, location: true,
  product_interest: true, source: true, assigned_to: true, value_estimate: true,
  next_follow_up_date: true, notes: true,
});
export type CreateLead = z.infer<typeof CreateLeadSchema>;

export const DealSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  job_title: z.string().nullable(),
  company_id: z.string().uuid(),
  primary_contact_id: z.string().uuid().nullable(),
  stage: DealStageSchema,
  amount: z.number().nonnegative(),
  product_use_case: z.string().nullable(),
  probability: z.number().int().min(0).max(100).nullable(),
  next_action: z.string().nullable(),
  notes: z.string().nullable(),
  owner_id: z.string().uuid(),
  expected_close_date: z.string().date().nullable(),
  deleted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Deal = z.infer<typeof DealSchema>;

export const CreateDealSchema = DealSchema.pick({
  title: true,
  job_title: true,
  company_id: true,
  primary_contact_id: true,
  stage: true,
  amount: true,
  product_use_case: true,
  probability: true,
  next_action: true,
  notes: true,
  expected_close_date: true,
}).partial({
  job_title: true, primary_contact_id: true, product_use_case: true,
  probability: true, next_action: true, notes: true, expected_close_date: true,
});
export type CreateDeal = z.infer<typeof CreateDealSchema>;

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  entity_type: EntityTypeSchema,
  entity_id: z.string().uuid(),
  type: ActivityTypeSchema,
  author_id: z.string().uuid(),
  body: z.string(),
  occurred_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const CreateActivitySchema = ActivitySchema.pick({
  entity_type: true,
  entity_id: true,
  type: true,
  body: true,
  occurred_at: true,
}).partial({ occurred_at: true });
export type CreateActivity = z.infer<typeof CreateActivitySchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().uuid(),
  action: z.string(),
  entity_type: EntityTypeSchema,
  entity_id: z.string().uuid(),
  before: z.record(z.unknown()).nullable(),
  after: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
