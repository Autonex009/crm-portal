"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ProfileInput = z.object({
  full_name: z.string().min(1, "Full name is required").max(255),
  avatar_url: z.string().max(2048).nullable().optional(),
});

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = ProfileInput.safeParse({
    full_name: formData.get("full_name"),
    avatar_url: (formData.get("avatar_url") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true, data: undefined };
}

const UserRole = z.enum(["owner", "admin", "sales", "account_manager", "client"]);

// Roles only an owner may assign or take away. Admins manage everyone else.
const PRIVILEGED_ROLES = new Set<string>(["owner", "admin"]);

export async function updateUserRole(id: string, role: z.infer<typeof UserRole>): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = UserRole.safeParse(role);
  if (!parsed.success) return { success: false, error: "Invalid role" };

  const { data: actor } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const actorRole = actor?.role;
  if (actorRole !== "admin" && actorRole !== "owner") {
    return { success: false, error: "Only admins can change roles" };
  }

  const { data: target } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!target) return { success: false, error: "User not found" };

  // Only the owner can create/remove admins or owners, or change an existing one.
  const touchesPrivileged = PRIVILEGED_ROLES.has(parsed.data) || PRIVILEGED_ROLES.has(target.role);
  if (touchesPrivileged && actorRole !== "owner") {
    return { success: false, error: "Only the owner can assign or remove the owner and admin roles." };
  }

  const { error } = await supabase.from("profiles").update({ role: parsed.data }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true, data: undefined };
}

const Provider = z.enum(["google", "slack"]);

export async function disconnectIntegration(provider: z.infer<typeof Provider>): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = Provider.safeParse(provider);
  if (!parsed.success) return { success: false, error: "Invalid provider" };

  const { error } = await supabase
    .from("integration_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", parsed.data);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true, data: undefined };
}
