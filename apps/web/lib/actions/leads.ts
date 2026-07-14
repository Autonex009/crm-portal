"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  status: z.enum(["new", "contacted", "qualified", "lost"]).default("new"),
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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
  status: "new" | "contacted" | "qualified" | "lost"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: undefined };
}
