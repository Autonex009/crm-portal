"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStatus, LeadStatusBadge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadSheet } from "./lead-sheet";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteLead, updateLeadStatus, archiveLead, restoreLead, hardDeleteLead } from "@/lib/actions/leads";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { ArrowRightLeft, TrendingUp, MoreHorizontal, Pencil, Trash2, Search, GitBranch, Archive, RotateCcw, Video, CheckSquare, Square } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { MermaidDiagram } from "@/components/ui/mermaid";
import { leadLifecycleChart } from "@/lib/pipeline-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  { label: "Replied", value: "replied" },
  { label: "Call Booked", value: "call_booked" },
  { label: "Call Done", value: "call_done" },
  { label: "Converted", value: "converted" },
  { label: "Dropped", value: "dropped" },
];

export function LeadsClient({
  leads,
  archivedLeads,
  companies,
  contacts,
}: {
  leads: Lead[];
  archivedLeads: Lead[];
  companies: Company[];
  contacts: Contact[];
}) {
  const [search, setSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleFor, setScheduleFor] = useState<Lead | null>(null);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<
    | { type: "delete"; id: string }
    | { type: "archive"; id: string }
    | { type: "hardDelete"; id: string }
    | null
  >(null);

  const lifecycleCounts = (["new", "contacted", "replied", "call_booked", "call_done", "converted", "dropped"] as const).reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status).length;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const NODE_TO_STATUS: Record<string, string> = {
    NW: "new",
    IC: "initial count",
    DS: "deck sent",
    CS: "call scheduled",
    CD: "call done",
    PS: "proposal sent",
    C: "closed",
    NI: "not interested",
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

  const filteredArchived = archivedLeads.filter((l) => {
    const q = archiveSearch.toLowerCase();
    return (
      (l.contact_name ?? l.title)?.toLowerCase().includes(q) ||
      l.job_title?.toLowerCase().includes(q) ||
      l.company_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.product_interest?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filtered.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filtered.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function handleDelete(id: string) {
    setConfirmAction({ type: "delete", id });
  }

  function handleArchive(id: string) {
    setConfirmAction({ type: "archive", id });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const result = await restoreLead(id);
      if (result.success) toast({ title: "Lead restored", variant: "success" });
      else toast({ title: "Error", description: result.error, variant: "destructive" });
    });
  }

  function handleHardDelete(id: string) {
    setConfirmAction({ type: "hardDelete", id });
  }

  function executeConfirmedAction() {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    startTransition(async () => {
      const result =
        type === "delete"
          ? await deleteLead(id)
          : type === "archive"
          ? await archiveLead(id)
          : await hardDeleteLead(id);

      if (result.success) {
        toast({
          title:
            type === "delete"
              ? "Lead deleted"
              : type === "archive"
              ? "Lead moved to archive"
              : "Lead permanently deleted",
          variant: "success",
        });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setConfirmAction(null);
    });
  }

  function handleStatusChange(id: string, status: LeadStatus) {
    startTransition(async () => {
      const result = await updateLeadStatus(id, status);
      if (!result.success) toast({ title: "Error", description: result.error, variant: "destructive" });
    });
  }

  function handleBatchArchive() {
    startTransition(async () => {
      let count = 0;
      for (const id of selectedLeadIds) {
        const res = await archiveLead(id);
        if (res.success) count++;
      }
      toast({ title: `${count} leads archived successfully`, variant: "success" });
      setSelectedLeadIds([]);
    });
  }

  return (
    <div className="space-y-4 relative">
      {/* Lead Lifecycle Collapsible */}
      {leads.length > 0 && (
        <details className="group rounded-2xl border bg-card shadow-xs transition-all">
          <summary className="flex cursor-pointer items-center gap-2.5 p-4 font-bold text-sm select-none hover:text-primary transition-colors">
            <GitBranch className="h-4 w-4 text-primary" />
            <span>Lead Lifecycle & Conversion Pipeline</span>
          </summary>
          <div className="border-t p-4 bg-muted/10">
            <MermaidDiagram
              chart={leadLifecycleChart(lifecycleCounts)}
              onNodeClick={handleNodeClick}
            />
          </div>
        </details>
      )}

      {/* Floating Batch Action Toolbar */}
      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-foreground text-background shadow-2xl border border-border"
          >
            <span className="text-xs font-semibold">
              {selectedLeadIds.length} leads selected
            </span>
            <div className="h-4 w-px bg-background/20" />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs font-semibold"
              onClick={handleBatchArchive}
              disabled={isPending}
            >
              <Archive className="h-3.5 w-3.5 mr-1.5" />
              Archive Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-background hover:bg-background/20"
              onClick={() => setSelectedLeadIds([])}
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="active" className="rounded-lg text-xs font-semibold">
              Active Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="archive" className="rounded-lg text-xs font-semibold">
              Archive ({archivedLeads.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ACTIVE LEADS TAB */}
        <TabsContent value="active" className="space-y-4 mt-0">
          <div className="flex items-center justify-between gap-3 flex-wrap bg-card p-3.5 rounded-2xl border shadow-xs">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, company, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-border"
              />
            </div>
            <div className="flex gap-1 rounded-xl border p-1 bg-muted/40 overflow-x-auto max-w-full">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === f.value
                      ? "bg-background shadow-xs text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <LeadSheet companies={companies} contacts={contacts} />
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title={search ? "No leads found" : "No active leads yet"}
                description={search ? `No leads match "${search}"` : "Start tracking your sales opportunities"}
                action={!search ? <LeadSheet companies={companies} contacts={contacts} /> : undefined}
              />
            ) : (
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-10 border-b">
                    <TableRow>
                      <TableHead className="w-10">
                        <button onClick={toggleSelectAll} className="flex items-center text-muted-foreground hover:text-foreground">
                          {selectedLeadIds.length === filtered.length && filtered.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Lead Name</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Company</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Contact Info</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Interest</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Date Created</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Next Follow-up</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <TableRow
                          key={lead.id}
                          className={`hover:bg-accent/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <TableCell className="w-10">
                            <button onClick={() => toggleSelectLead(lead.id)} className="flex items-center text-muted-foreground hover:text-foreground">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-sm text-foreground">{lead.contact_name ?? lead.title ?? "Untitled Lead"}</p>
                            {lead.job_title && (
                              <p className="text-xs text-muted-foreground font-medium">{lead.job_title}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <p className="font-semibold text-foreground">{lead.company_name ?? "—"}</p>
                            {lead.location && (
                              <p className="text-xs text-muted-foreground/70">{lead.location}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`} className="font-medium text-foreground hover:text-primary hover:underline">{lead.email}</a>
                            ) : lead.phone ? (
                              <span className="font-medium">{lead.phone}</span>
                            ) : (
                              "—"
                            )}
                            {lead.linkedin_url && (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs font-semibold text-primary hover:underline mt-0.5"
                              >
                                LinkedIn Profile
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                            <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium border">{lead.product_interest ?? "—"}</span>
                          </TableCell>
                          <TableCell>
                            <LeadStatusBadge status={lead.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground font-medium">
                            {lead.created_at ? formatDate(lead.created_at) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground font-medium">
                            {lead.next_follow_up_date ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-500/20">
                                {formatDate(lead.next_follow_up_date)}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                <LeadSheet
                                  lead={lead}
                                  companies={companies}
                                  contacts={contacts}
                                  trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg">
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Lead
                                    </DropdownMenuItem>
                                  }
                                />
                                <DropdownMenuItem onClick={() => setScheduleFor(lead)} className="rounded-lg">
                                  <Video className="h-4 w-4 mr-2" />
                                  Schedule Meeting
                                </DropdownMenuItem>
                                {lead.status !== "converted" && (
                                  <DropdownMenuItem
                                    className="text-emerald-600 font-bold focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded-lg"
                                    onClick={() => setConvertLead(lead)}
                                  >
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Convert to Deal
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {(["new", "contacted", "replied", "call_booked", "call_done", "converted", "dropped"] as const).map((s) => (
                                  s !== lead.status && (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)} className="rounded-lg text-xs">
                                      Mark as {s.replace("_", " ")}
                                    </DropdownMenuItem>
                                  )
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleArchive(lead.id)}
                                  className="rounded-lg"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive rounded-lg"
                                  onClick={() => handleDelete(lead.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">Showing {filtered.length} of {leads.length} total active leads</p>
        </TabsContent>

        {/* ARCHIVED LEADS TAB */}
        <TabsContent value="archive" className="space-y-4 mt-0">
          <div className="flex items-center gap-3 bg-card p-3.5 rounded-2xl border shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived leads..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
            {filteredArchived.length === 0 ? (
              <EmptyState
                icon={<Archive className="h-8 w-8" />}
                title={archiveSearch ? "No results" : "Archive is empty"}
                description={archiveSearch ? `No archived leads match "${archiveSearch}"` : "Leads you archive will appear here"}
              />
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md border-b">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Lead Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Company</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Contact Info</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Interest</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Date Created</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Next Follow-up</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchived.map((lead) => (
                    <TableRow key={lead.id} className="opacity-75 hover:opacity-100 transition-opacity">
                      <TableCell>
                        <p className="font-bold text-sm text-foreground">{lead.contact_name ?? lead.title ?? "Untitled Lead"}</p>
                        {lead.job_title && (
                          <p className="text-xs text-muted-foreground">{lead.job_title}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <p className="font-semibold">{lead.company_name ?? "—"}</p>
                        {lead.location && (
                          <p className="text-xs text-muted-foreground/70">{lead.location}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.email ? (
                          <span>{lead.email}</span>
                        ) : lead.phone ? (
                          <span>{lead.phone}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                        {lead.product_interest ?? "—"}
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.created_at ? formatDate(lead.created_at) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.next_follow_up_date ? formatDate(lead.next_follow_up_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem
                              onClick={() => handleRestore(lead.id)}
                              className="rounded-lg"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive rounded-lg"
                              onClick={() => handleHardDelete(lead.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete permanently
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
          <p className="text-xs font-semibold text-muted-foreground">{filteredArchived.length} of {archivedLeads.length} archived leads</p>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        description={
          confirmAction?.type === "archive"
            ? "This will move this lead to the archive."
            : confirmAction?.type === "hardDelete"
            ? "This will permanently delete this lead. This cannot be undone."
            : confirmAction
            ? "This will delete this lead."
            : undefined
        }
        destructive={confirmAction?.type !== "archive"}
        loading={isPending}
        onConfirm={executeConfirmedAction}
      />

      <ScheduleMeetingDialog
        lead={scheduleFor}
        onOpenChange={(open) => !open && setScheduleFor(null)}
      />

      <ConvertLeadDialog
        lead={convertLead}
        onOpenChange={(open) => !open && setConvertLead(null)}
      />
    </div>
  );
}
