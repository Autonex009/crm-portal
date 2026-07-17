"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const CompanyInput = z.object({
  name: z.string().min(1, "Name is required").max(255),
  domain: z.string().max(255).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
});

export async function createCompany(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = CompanyInput.safeParse({
    name: formData.get("name"),
    domain: (formData.get("domain") as string) || null,
    industry: (formData.get("industry") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/companies");
  return { success: true, data: { id: data.id } };
}

export async function updateCompany(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = CompanyInput.safeParse({
    name: formData.get("name"),
    domain: (formData.get("domain") as string) || null,
    industry: (formData.get("industry") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { error } = await supabase.from("companies").update(parsed.data).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { success: true, data: undefined };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/companies");
  return { success: true, data: undefined };
}

export async function archiveCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("companies")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/companies");
  return { success: true, data: undefined };
}

export async function restoreCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("companies")
    .update({ archived_at: null })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/companies");
  return { success: true, data: undefined };
}

export async function hardDeleteCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/companies");
  return { success: true, data: undefined };
}

