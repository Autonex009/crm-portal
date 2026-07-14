"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ActivityInput = z.object({
  entity_type: z.enum(["company", "contact", "lead", "deal", "quote", "invoice"]),
  entity_id: z.string().uuid(),
  type: z.enum(["note", "call", "email", "meeting", "system"]),
  body: z.string().min(1, "Activity body required"),
});

export async function createActivity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = ActivityInput.safeParse({
    entity_type: formData.get("entity_type"),
    entity_id: formData.get("entity_id"),
    type: formData.get("type"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { data, error } = await supabase
    .from("activities")
    .insert({ ...parsed.data, author_id: user.id })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  const entityPath = `/${parsed.data.entity_type === "company" ? "companies" : parsed.data.entity_type + "s"}/${parsed.data.entity_id}`;
  revalidatePath(entityPath);

  return { success: true, data: { id: data.id } };
}

export async function deleteActivity(id: string, entityType: string, entityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("activities").delete().eq("id", id).eq("author_id", user.id);
  if (error) return { success: false, error: error.message };

  const entityPath = `/${entityType === "company" ? "companies" : entityType + "s"}/${entityId}`;
  revalidatePath(entityPath);
  return { success: true, data: undefined };
}
