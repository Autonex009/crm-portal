import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";
import { DealsKanban } from "./_components/deals-kanban";

export const metadata = { title: "Deals — CRM Portal" };

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: deals }, { data: companies }, { data: contacts }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, title, stage, amount, expected_close_date, companies(name), contacts:primary_contact_id(first_name, last_name)")
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

  type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";

  const mapped = (deals ?? []).map((d) => ({
    id: d.id,
    title: d.title ?? "Untitled Deal",
    stage: d.stage as DealStage,
    amount: d.amount,
    expected_close_date: d.expected_close_date,
    company_name: Array.isArray(d.companies)
      ? (d.companies[0] as { name: string } | undefined)?.name ?? null
      : (d.companies as { name: string } | null)?.name ?? null,
    contact_name: (() => {
      const c = Array.isArray(d.contacts) ? d.contacts[0] : d.contacts;
      return c ? `${(c as { first_name: string; last_name: string }).first_name} ${(c as { first_name: string; last_name: string }).last_name}` : null;
    })(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-6 w-6 text-muted-foreground" />
          Deals
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your sales pipeline
        </p>
      </div>

      <DealsKanban
        initialDeals={mapped}
        companies={companies ?? []}
        contacts={contacts ?? []}
      />
    </div>
  );
}
