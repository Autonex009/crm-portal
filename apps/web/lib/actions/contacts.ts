"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ContactInput = z.object({
  company_id: z.string().uuid("Valid company required"),
  first_name: z.string().min(1, "First name required").max(100),
  last_name: z.string().min(1, "Last name required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().max(50).nullable().optional(),
  title: z.string().max(100).nullable().optional(),
});

export async function createContact(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = ContactInput.safeParse({
    company_id: formData.get("company_id"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { data, error } = await supabase
    .from("contacts")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/contacts");
  revalidatePath(`/companies/${parsed.data.company_id}`);
  return { success: true, data: { id: data.id } };
}

export async function updateContact(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = ContactInput.safeParse({
    company_id: formData.get("company_id"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { error } = await supabase.from("contacts").update(parsed.data).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}
