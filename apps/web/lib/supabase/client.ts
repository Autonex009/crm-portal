"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@crm/db/types/database.types";

// Cast to SupabaseClient<Database> directly because @supabase/ssr@0.6.1 imports
// GenericSchema from a path removed in @supabase/supabase-js@2.108.2, causing
// the schema type parameter to resolve to `never` via the ssr wrapper.
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as SupabaseClient<Database>;
}
