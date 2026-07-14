"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const emptyToNull = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().max(4000).nullable().optional()
);

const DealInput = z.object({
  title: z.string().min(1, "Name required").max(255),
  job_title: emptyToNull,
  company_id: z.string().uuid("Valid company required"),
  primary_contact_id: z.string().uuid().nullable().optional(),
  stage: z.enum(["prospect", "proposal", "negotiation", "won", "lost"]).default("prospect"),
  amount: z.coerce.number().nonnegative().default(0),
  product_use_case: emptyToNull,
  probability: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int().min(0).max(100).nullable().optional()
  ),
  next_action: emptyToNull,
  notes: emptyToNull,
  expected_close_date: z.string().nullable().optional(),
});

function dealFields(formData: FormData) {
  return {
    title: formData.get("title"),
    job_title: formData.get("job_title"),
    company_id: formData.get("company_id"),
    primary_contact_id: (formData.get("primary_contact_id") as string) || null,
    stage: formData.get("stage") || "prospect",
    amount: formData.get("amount") || 0,
    product_use_case: formData.get("product_use_case"),
    probability: (formData.get("probability") as string) ?? null,
    next_action: formData.get("next_action"),
    notes: formData.get("notes"),
    expected_close_date: (formData.get("expected_close_date") as string) || null,
  };
}

export async function createDeal(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = DealInput.safeParse(dealFields(formData));
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { data, error } = await supabase
    .from("deals")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/deals");
  return { success: true, data: { id: data.id } };
}

export async function updateDeal(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = DealInput.safeParse(dealFields(formData));
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { error } = await supabase.from("deals").update(parsed.data).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { success: true, data: undefined };
}

export async function updateDealStage(
  id: string,
  stage: "prospect" | "proposal" | "negotiation" | "won" | "lost"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/deals");
  return { success: true, data: undefined };
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("deals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/deals");
  return { success: true, data: undefined };
}
