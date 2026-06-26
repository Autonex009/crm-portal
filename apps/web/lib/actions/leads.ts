"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const LeadInput = z.object({
  title: z.string().min(1, "Title required").max(255),
  company_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  status: z.enum(["new", "contacted", "qualified", "lost"]).default("new"),
  value_estimate: z.coerce.number().nonnegative().nullable().optional(),
});

export async function createLead(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = LeadInput.safeParse({
    title: formData.get("title"),
    company_id: (formData.get("company_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    source: (formData.get("source") as string) || null,
    status: formData.get("status") || "new",
    value_estimate: (formData.get("value_estimate") as string) || null,
  });
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

  const parsed = LeadInput.safeParse({
    title: formData.get("title"),
    company_id: (formData.get("company_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    source: (formData.get("source") as string) || null,
    status: formData.get("status"),
    value_estimate: (formData.get("value_estimate") as string) || null,
  });
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
