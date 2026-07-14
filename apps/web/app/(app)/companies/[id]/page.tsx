import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Globe, Briefcase, ArrowLeft, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { AddActivityForm } from "@/components/crm/add-activity-form";
import { CompanySheet } from "../_components/company-sheet";
import { ContactSheet } from "../../contacts/_components/contact-sheet";
import { formatDate, formatCurrency, initials } from "@/lib/utils";
import { DealStageBadge } from "@/components/ui/badge";

export const metadata = { title: "Company Details — CRM Portal" };

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!company) notFound();

  const [{ data: contacts }, { data: deals }, { data: activities }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, title")
      .eq("company_id", id)
      .is("deleted_at", null)
      .order("first_name"),
    supabase
      .from("deals")
      .select("id, title, stage, amount, probability, product_use_case, next_action, expected_close_date")
      .eq("company_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, profiles:author_id(full_name, avatar_url)")
      .eq("entity_type", "company")
      .eq("entity_id", id)
      .order("occurred_at", { ascending: false })
      .limit(30),
  ]);

  const mappedActivities = (activities ?? []).map((a) => ({
    id: a.id,
    type: a.type as "note" | "call" | "email" | "meeting" | "system",
    body: a.body,
    occurred_at: a.occurred_at,
    author: Array.isArray(a.profiles) ? a.profiles[0] ?? null : a.profiles,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/companies">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <nav className="text-sm text-muted-foreground">
          <Link href="/companies" className="hover:text-foreground">Companies</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{company.name}</span>
        </nav>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <Avatar className="h-16 w-16 border-4 border-background ring-1 ring-border">
              <AvatarFallback className="text-xl bg-blue-100 text-blue-700 font-bold">
                {initials(company.name)}
              </AvatarFallback>
            </Avatar>
            <CompanySheet
              company={company}
              trigger={
                <Button variant="outline" size="sm">
                  Edit Company
                </Button>
              }
            />
          </div>

          <h1 className="text-2xl font-bold">{company.name}</h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {company.industry && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <Badge variant="secondary">{company.industry}</Badge>
              </div>
            )}
            {company.domain && (
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {company.domain}
              </a>
            )}
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Added {formatDate(company.created_at)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{contacts?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{deals?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatCurrency(deals?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="contacts">
            <TabsList>
              <TabsTrigger value="contacts">Contacts ({contacts?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({deals?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between p-4 border-b">
                  <p className="text-sm font-medium">People at {company.name}</p>
                  <ContactSheet companyId={id} companyName={company.name} />
                </div>
                {!contacts?.length ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No contacts yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {contacts.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-4">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {initials(`${c.first_name} ${c.last_name}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        </div>
                        {c.title && (
                          <Badge variant="secondary" className="text-xs font-normal">{c.title}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="deals">
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <p className="text-sm font-medium">Active deals</p>
                </div>
                {!deals?.length ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No deals yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {deals.map((d) => (
                      <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{d.title}</p>
                          {d.product_use_case && (
                            <p className="text-xs text-muted-foreground truncate">{d.product_use_case}</p>
                          )}
                          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            {d.expected_close_date && <span>Close {formatDate(d.expected_close_date)}</span>}
                            {d.next_action && <span>Next: {d.next_action}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(d.amount)}</p>
                          <DealStageBadge stage={d.stage as Parameters<typeof DealStageBadge>[0]["stage"]} />
                          {d.probability != null && (
                            <p className="text-xs text-muted-foreground mt-0.5">{d.probability}% likely</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Log Activity</h3>
            <AddActivityForm entityType="company" entityId={id} />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Activity Timeline</h3>
            <ActivityTimeline activities={mappedActivities} />
          </div>
        </div>
      </div>
    </div>
  );
}
