import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Handshake, GitBranch } from "lucide-react";
import { DealsKanban } from "./_components/deals-kanban";
import { MermaidDiagram } from "@/components/ui/mermaid";
import { ImportDialog } from "@/components/crm/import-dialog";
import { dealPipelineChart } from "@/lib/pipeline-charts";

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

  const STAGE_IDS = ["prospect", "proposal", "negotiation", "won", "lost"] as const;
  const pipelineStats = STAGE_IDS.reduce(
    (acc, id) => {
      const inStage = (deals ?? []).filter((d) => d.stage === id);
      acc[id] = {
        count: inStage.length,
        value: inStage.reduce((s, d) => s + (d.amount ?? 0), 0),
      };
      return acc;
    },
    {} as Record<DealStage, { count: number; value: number }>
  );

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-6 w-6 text-muted-foreground" />
            Deals
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your sales pipeline
          </p>
        </div>
        <ImportDialog entity="deals" />
      </div>

      {(deals?.length ?? 0) > 0 && (
        <details className="group rounded-xl border bg-card" open>
          <summary className="flex cursor-pointer items-center gap-2 p-4 font-semibold text-sm select-none">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Pipeline Flow
            <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
              Show
            </span>
          </summary>
          <div className="border-t p-4">
            <MermaidDiagram chart={dealPipelineChart(pipelineStats)} />
          </div>
        </details>
      )}

      <DealsKanban
        initialDeals={mapped}
        companies={companies ?? []}
        contacts={contacts ?? []}
      />
    </div>
  );
}
