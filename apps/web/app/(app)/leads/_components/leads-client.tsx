"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { TrendingUp, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "qualified" | "lost";

interface Lead {
  id: string;
  title: string | null;
  company_id: string | null;
  contact_id: string | null;
  source: string | null;
  status: LeadStatus;
  value_estimate: number | null;
  created_at: string;
  company_name: string | null;
  contact_name: string | null;
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

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.title?.toLowerCase().includes(q) ||
      l.company_name?.toLowerCase().includes(q) ||
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
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{lead.title ?? "Untitled Lead"}</p>
                    {lead.contact_name && (
                      <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.company_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.source ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {lead.value_estimate != null ? formatCurrency(lead.value_estimate) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(lead.created_at)}
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
