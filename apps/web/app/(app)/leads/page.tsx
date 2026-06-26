import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { LeadsClient } from "./_components/leads-client";

export const metadata = { title: "Leads — CRM Portal" };

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: leads }, { data: companies }, { data: contacts }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, title, company_id, contact_id, source, status, value_estimate, created_at, companies(name), contacts(first_name, last_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .is("deleted_at", null)
      .order("first_name"),
  ]);

  const mapped = (leads ?? []).map((l) => ({
    ...l,
    title: l.title ?? null,
    company_name: Array.isArray(l.companies)
      ? (l.companies[0] as { name: string } | undefined)?.name ?? null
      : (l.companies as { name: string } | null)?.name ?? null,
    contact_name: (() => {
      const c = Array.isArray(l.contacts) ? l.contacts[0] : l.contacts;
      return c ? `${(c as { first_name: string; last_name: string }).first_name} ${(c as { first_name: string; last_name: string }).last_name}` : null;
    })(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          Leads
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {leads?.length ?? 0} total leads
        </p>
      </div>

      <LeadsClient leads={mapped} companies={companies ?? []} contacts={contacts ?? []} />
    </div>
  );
}
