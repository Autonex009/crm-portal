"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStatusBadge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadSheet } from "./lead-sheet";
import { deleteLead, updateLeadStatus } from "@/lib/actions/leads";
import { toast } from "@/components/ui/use-toast";
import { TrendingUp, MoreHorizontal, Pencil, Trash2, Search, GitBranch } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MermaidDiagram } from "@/components/ui/mermaid";
import { leadLifecycleChart, type LeadStatus } from "@/lib/pipeline-charts";



interface Lead {
  id: string;
  title: string | null;
  contact_name: string | null;
  job_title: string | null;
  company_id: string | null;
  contact_id: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string | null;
  location: string | null;
  product_interest: string | null;
  source: string | null;
  status: LeadStatus;
  value_estimate: number | null;
  next_follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  company_name: string | null;
  linked_contact_name: string | null;
}

interface Company { id: string; name: string }
interface Contact { id: string; first_name: string; last_name: string }

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Lost", value: "lost" },
];

export function LeadsClient({
  leads,
  companies,
  contacts,
}: {
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const lifecycleCounts = (["new", "contacted", "qualified", "lost"] as const).reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status).length;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const NODE_TO_STATUS: Record<string, string> = {
    NW: "new",
    C: "contacted",
    Q: "qualified",
    LO: "lost",
  };

  const router = useRouter();

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === "D") {
      router.push("/deals");
      return;
    }
    const status = NODE_TO_STATUS[nodeId];
    if (status) {
      setStatusFilter(status);
    }
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (l.contact_name ?? l.title)?.toLowerCase().includes(q) ||
      l.job_title?.toLowerCase().includes(q) ||
      l.company_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.product_interest?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleDelete(id: string) {
    if (!confirm("Delete this lead?")) return;
    startTransition(async () => {
      const result = await deleteLead(id);
      if (result.success) toast({ title: "Lead deleted", variant: "success" });
      else toast({ title: "Error", description: result.error, variant: "destructive" });
    });
  }

  function handleStatusChange(id: string, status: LeadStatus) {
    startTransition(async () => {
      const result = await updateLeadStatus(id, status);
      if (!result.success) toast({ title: "Error", description: result.error, variant: "destructive" });
    });
  }

  return (
    <div className="space-y-4">
      {leads.length > 0 && (
        <details className="group rounded-xl border bg-card" open>
          <summary className="flex cursor-pointer items-center gap-2 p-4 font-semibold text-sm select-none">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Lead Lifecycle
          </summary>
          <div className="border-t p-4">
            <MermaidDiagram
              chart={leadLifecycleChart(lifecycleCounts)}
              onNodeClick={handleNodeClick}
            />
          </div>
        </details>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1 rounded-lg border p-1 bg-muted/30">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <LeadSheet companies={companies} contacts={contacts} />
      </div>

      <div className="rounded-lg border bg-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-8 w-8" />}
            title={search ? "No results" : "No leads yet"}
            description={search ? `No leads match "${search}"` : "Start tracking your sales leads"}
            action={!search ? <LeadSheet companies={companies} contacts={contacts} /> : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{lead.contact_name ?? lead.title ?? "Untitled Lead"}</p>
                    {lead.job_title && (
                      <p className="text-xs text-muted-foreground">{lead.job_title}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <p>{lead.company_name ?? "—"}</p>
                    {lead.location && (
                      <p className="text-xs text-muted-foreground/70">{lead.location}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="hover:text-foreground hover:underline">{lead.email}</a>
                    ) : lead.phone ? (
                      <span>{lead.phone}</span>
                    ) : (
                      "—"
                    )}
                    {lead.linkedin_url && (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                    {lead.product_interest ?? "—"}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.next_follow_up_date ? formatDate(lead.next_follow_up_date) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <LeadSheet
                          lead={lead}
                          companies={companies}
                          contacts={contacts}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuSeparator />
                        {(["new", "contacted", "qualified", "lost"] as const).map((s) => (
                          s !== lead.status && (
                            <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)}>
                              Mark as {s}
                            </DropdownMenuItem>
                          )
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {leads.length} leads</p>
    </div>
  );
}
