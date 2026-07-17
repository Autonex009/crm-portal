import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, Calendar, IndianRupee, Percent, Package, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealStageBadge } from "@/components/ui/badge";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { AddActivityForm } from "@/components/crm/add-activity-form";
import { DealSheet } from "../_components/deal-sheet";
import { MermaidDiagram } from "@/components/ui/mermaid";
import { dealStageFlowChart, type DealStage as ChartDealStage } from "@/lib/pipeline-charts";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Deal Details — CRM Portal" };

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const { data: deal } = await supabase
    .from("deals")
    .select("*, companies(name, domain), contacts:primary_contact_id(first_name, last_name, email, title)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!deal) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, body, occurred_at, profiles:author_id(full_name, avatar_url)")
    .eq("entity_type", "deal")
    .eq("entity_id", id)
    .order("occurred_at", { ascending: false })
    .limit(30);

  const [{ data: companies }, { data: contacts }] = await Promise.all([
    supabase.from("companies").select("id, name").is("deleted_at", null).is("archived_at", null).order("name"),
    supabase.from("contacts").select("id, first_name, last_name").is("deleted_at", null).is("archived_at", null).order("first_name"),
  ]);

  const mappedActivities = (activities ?? []).map((a) => ({
    id: a.id,
    type: a.type as "note" | "call" | "email" | "meeting" | "system",
    body: a.body,
    occurred_at: a.occurred_at,
    author: Array.isArray(a.profiles) ? a.profiles[0] ?? null : a.profiles,
  }));

  const company = Array.isArray(deal.companies) ? deal.companies[0] : deal.companies;
  const contact = Array.isArray(deal.contacts) ? deal.contacts[0] : deal.contacts;

  type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/deals">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <nav className="text-sm text-muted-foreground">
          <Link href="/deals" className="hover:text-foreground">Deals</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{deal.title}</span>
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{deal.title}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <DealStageBadge stage={deal.stage as DealStage} />
                </div>
              </div>
              <DealSheet
                deal={{ ...deal, stage: deal.stage as DealStage }}
                companies={companies ?? []}
                contacts={contacts ?? []}
                trigger={<Button variant="outline" size="sm">Edit Deal</Button>}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deal Value</p>
                  <p className="font-bold text-lg">{formatCurrency(deal.amount)}</p>
                </div>
              </div>

              {company && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <Link href={`/companies/${deal.company_id}`} className="font-semibold hover:underline">
                      {(company as { name: string }).name}
                    </Link>
                  </div>
                </div>
              )}

              {contact && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Contact</p>
                    <p className="font-semibold">
                      {(contact as { first_name: string; last_name: string }).first_name} {(contact as { first_name: string; last_name: string }).last_name}
                    </p>
                  </div>
                </div>
              )}

              {deal.expected_close_date && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Closing</p>
                    <p className="font-semibold">{formatDate(deal.expected_close_date)}</p>
                  </div>
                </div>
              )}

              {deal.probability != null && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-100 p-2">
                    <Percent className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Probability</p>
                    <p className="font-semibold">{deal.probability}%</p>
                  </div>
                </div>
              )}

              {deal.product_use_case && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Product / Use Case</p>
                    <p className="font-semibold">{deal.product_use_case}</p>
                  </div>
                </div>
              )}

              {deal.next_action && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-rose-100 p-2">
                    <Flag className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Action</p>
                    <p className="font-semibold">{deal.next_action}</p>
                  </div>
                </div>
              )}
            </div>

            {deal.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Deal Journey</h3>
            <MermaidDiagram chart={dealStageFlowChart(deal.stage as ChartDealStage)} />
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Log Activity</h3>
            <AddActivityForm entityType="deal" entityId={id} />
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <ActivityTimeline activities={mappedActivities} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Pipeline Stage</h3>
            <div className="space-y-1">
              {(["prospect", "proposal", "negotiation", "won", "lost"] as const).map((stage) => (
                <div
                  key={stage}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm capitalize ${
                    deal.stage === stage
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      deal.stage === stage ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  {stage}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(deal.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{formatDate(deal.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
