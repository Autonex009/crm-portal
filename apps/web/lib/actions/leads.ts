"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const emptyToNull = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().max(2000).nullable().optional()
);

const LeadInput = z.object({
  title: z.string().min(1, "Name required").max(255),
  contact_name: emptyToNull,
  job_title: emptyToNull,
  company_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  email: emptyToNull,
  phone: emptyToNull,
  linkedin_url: emptyToNull,
  industry: emptyToNull,
  location: emptyToNull,
  product_interest: emptyToNull,
  source: z.string().max(100).nullable().optional(),
  status: z.enum([
    "new", 
    "contacted", 
    "replied", 
    "call_booked", 
    "call_done", 
    "converted", 
    "dropped"
  ]).default("new"),
  value_estimate: z.coerce.number().nonnegative().nullable().optional(),
  next_follow_up_date: emptyToNull,
  notes: emptyToNull,
});

function leadFields(formData: FormData) {
  return {
    title: formData.get("title"),
    contact_name: formData.get("contact_name"),
    job_title: formData.get("job_title"),
    company_id: (formData.get("company_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    email: formData.get("email"),
    phone: formData.get("phone"),
    linkedin_url: formData.get("linkedin_url"),
    industry: formData.get("industry"),
    location: formData.get("location"),
    product_interest: formData.get("product_interest"),
    source: (formData.get("source") as string) || null,
    status: formData.get("status") || "new",
    value_estimate: (formData.get("value_estimate") as string) || null,
    next_follow_up_date: formData.get("next_follow_up_date"),
    notes: formData.get("notes"),
  };
}

export async function createLead(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = LeadInput.safeParse(leadFields(formData));
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, assigned_to: user.id })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/leads");
  return { success: true, data: { id: data.id } };
}

export async function updateLead(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = LeadInput.safeParse(leadFields(formData));
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { error } = await supabase.from("leads").update(parsed.data).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function updateLeadStatus(
  id: string,
  status: "new" | "contacted" | "replied" | "call_booked" | "call_done" | "converted" | "dropped"
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function convertLeadToDeal(
  leadId: string,
  dealData: { title?: string; amount?: number; expected_close_date?: string; notes?: string }
): Promise<ActionResult<{ dealId: string }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Fetch Lead
  const { data: lead, error: fetchErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (fetchErr || !lead) return { success: false, error: "Lead not found" };
  if (!lead.company_id) return { success: false, error: "Lead must be associated with a company before converting to a deal" };

  // 2. Mark Lead as converted
  const { error: leadUpdateErr } = await supabase
    .from("leads")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (leadUpdateErr) return { success: false, error: leadUpdateErr.message };

  // 3. Create Deal
  const { data: deal, error: dealCreateErr } = await supabase
    .from("deals")
    .insert({
      title: dealData.title || lead.title || `${lead.contact_name || "New"} Deal`,
      job_title: lead.job_title || null,
      company_id: lead.company_id,
      primary_contact_id: lead.contact_id || null,
      lead_id: leadId,
      stage: "discovery",
      amount: dealData.amount ?? lead.value_estimate ?? 1000000,
      product_use_case: lead.product_interest || null,
      probability: 20,
      next_action: "Schedule initial discovery & site assessment review",
      notes: dealData.notes || lead.notes || null,
      owner_id: lead.assigned_to || user.id,
      expected_close_date: dealData.expected_close_date || new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (dealCreateErr || !deal) return { success: false, error: dealCreateErr?.message ?? "Failed to create deal" };

  // 4. Log Activity
  await supabase.from("activities").insert({
    entity_type: "deal",
    entity_id: deal.id,
    type: "system",
    author_id: user.id,
    body: `Deal created via Lead conversion (${lead.title || lead.contact_name || leadId})`,
  });

  revalidatePath("/leads");
  revalidatePath("/deals");
  return { success: true, data: { dealId: deal.id } };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function archiveLead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function restoreLead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ archived_at: null })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function hardDeleteLead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

