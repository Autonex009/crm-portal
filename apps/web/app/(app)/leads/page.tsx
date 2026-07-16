import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { LeadsClient } from "./_components/leads-client";
import { ImportDialog } from "@/components/crm/import-dialog";

export const metadata = { title: "Leads — CRM Portal" };

export default async function LeadsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const [{ data: leads }, { data: companies }, { data: contacts }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, title, contact_name, job_title, company_id, contact_id, email, phone, linkedin_url, industry, location, product_interest, source, status, value_estimate, next_follow_up_date, notes, created_at, companies(name), contacts(first_name, last_name)")
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



  const mapped = (leads ?? []).map((l) => {
    const { companies, contacts, ...rest } = l;
    const linkedContact = Array.isArray(contacts) ? contacts[0] : contacts;
    return {
      ...rest,
      title: l.title ?? null,
      company_name: Array.isArray(companies)
        ? (companies[0] as { name: string } | undefined)?.name ?? null
        : (companies as { name: string } | null)?.name ?? null,
      linked_contact_name: linkedContact
        ? `${(linkedContact as { first_name: string; last_name: string }).first_name} ${(linkedContact as { first_name: string; last_name: string }).last_name}`
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
            Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {leads?.length ?? 0} total leads
          </p>
        </div>
        <ImportDialog entity="leads" />
      </div>



      <LeadsClient leads={mapped} companies={companies ?? []} contacts={contacts ?? []} />
    </div>
  );
}
