"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronRight,
  FileText,
  GitBranch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MermaidDiagram } from "@/components/ui/mermaid";
import { toast } from "@/components/ui/use-toast";
import { quotePipelineChart } from "@/lib/pipeline-charts";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORY_LABEL, QUOTE_STATUS_TONE, useQuotesStore } from "./quote-store";
import { type QuoteStatus } from "./quote-module-data";
import { formatDate } from "@/lib/utils";

const STATUS_CARD_ORDER: QuoteStatus[] = ["Draft", "Presented", "Accepted", "Rejected"];

const PAGE_SIZE = 8;

type SortKey = "opportunity" | "productCategory" | "createdAt" | "status";

export function QuotesDashboard() {
  const router = useRouter();
  const quotes = useQuotesStore((state) => state.quotes);
  const deleteQuote = useQuotesStore((state) => state.deleteQuote);
  const [hydrated, setHydrated] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ quoteNumber: string; quoteName: string } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const base: Record<QuoteStatus, number> = { Draft: 0, Presented: 0, Accepted: 0, Rejected: 0, Closed: 0 };
    quotes.forEach((quote) => {
      base[quote.status] += 1;
    });
    return base;
  }, [quotes]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const list = quotes.filter((quote) => {
      const matchesSearch =
        !normalizedSearch ||
        quote.opportunity.label.toLowerCase().includes(normalizedSearch) ||
        quote.quoteName.toLowerCase().includes(normalizedSearch) ||
        quote.account.label.toLowerCase().includes(normalizedSearch) ||
        quote.quoteNumber.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "opportunity":
          return a.opportunity.label.localeCompare(b.opportunity.label) * dir;
        case "productCategory":
          return a.productCategory.localeCompare(b.productCategory) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "createdAt":
        default:
          return (
            (new Date(a.createdBy.createdAt).getTime() - new Date(b.createdBy.createdAt).getTime()) * dir
          );
      }
    });
  }, [quotes, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function handleStatusCardClick(status: QuoteStatus) {
    setPage(1);
    setStatusFilter((current) => (current === status ? "all" : status));
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />;
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteQuote(deleteTarget.quoteNumber);
    toast({
      title: "Quote deleted",
      description: `${deleteTarget.quoteNumber} was removed.`,
      variant: "success",
    });
    setDeleteTarget(null);
  }

  const totalQuotes = quotes.length;

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-muted-foreground" />
            Quotes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track every quotation from draft to closed invoice.
          </p>
        </div>
        <Button onClick={() => router.push("/quotes/new")}>
          <Plus className="h-4 w-4" />
          Add Quote
        </Button>
      </div>

      {totalQuotes > 0 ? (
        <details className="group rounded-xl border bg-card" open>
          <summary className="flex cursor-pointer items-center gap-2 p-4 font-semibold text-sm select-none">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Lifecycle Overview
            <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
          </summary>
          <div className="border-t p-4">
            <MermaidDiagram
              chart={quotePipelineChart({
                Draft: counts.Draft,
                Presented: counts.Presented,
                Accepted: counts.Accepted,
                Rejected: counts.Rejected,
                Closed: counts.Closed,
              })}
            />
          </div>
        </details>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUS_CARD_ORDER.map((status) => {
          const count = counts[status];
          const share = totalQuotes > 0 ? Math.round((count / totalQuotes) * 100) : 0;
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusCardClick(status)}
              className={cn(
                "rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50",
                isActive && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{status}</p>
                <Badge variant={QUOTE_STATUS_TONE[status]}>{share}%</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{share}% of all quotes</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
          {(["all", "Draft", "Presented", "Accepted", "Rejected", "Closed"] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                statusFilter === value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === "all" ? "All" : value}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {!hydrated ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={search || statusFilter !== "all" ? "No results" : "No quotes yet"}
            description={
              search || statusFilter !== "all"
                ? "No quotes match your current search or filter."
                : "Create your first quotation to get started."
            }
            action={
              !search && statusFilter === "all" ? (
                <Button onClick={() => router.push("/quotes/new")}>
                  <Plus className="h-4 w-4" />
                  Add Quote
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1.5 font-medium" onClick={() => toggleSort("opportunity")}>
                    Opportunity Name
                    {sortIndicator("opportunity")}
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1.5 font-medium" onClick={() => toggleSort("productCategory")}>
                    Product Category
                    {sortIndicator("productCategory")}
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1.5 font-medium" onClick={() => toggleSort("createdAt")}>
                    Created At
                    {sortIndicator("createdAt")}
                  </button>
                </TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1.5 font-medium" onClick={() => toggleSort("status")}>
                    Status
                    {sortIndicator("status")}
                  </button>
                </TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((quote) => (
                <TableRow key={quote.quoteNumber}>
                  <TableCell>
                    <p className="font-medium text-sm">{quote.opportunity.label}</p>
                    <p className="text-xs text-muted-foreground">{quote.quoteNumber} · {quote.quoteName}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{PRODUCT_CATEGORY_LABEL[quote.productCategory]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(quote.createdBy.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{quote.createdBy.name}</TableCell>
                  <TableCell>
                    <Badge variant={QUOTE_STATUS_TONE[quote.status]}>{quote.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/quotes/new?edit=${encodeURIComponent(quote.quoteNumber)}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label={`Edit ${quote.quoteNumber}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${quote.quoteNumber}`}
                        onClick={() => setDeleteTarget({ quoteNumber: quote.quoteNumber, quoteName: quote.quoteName })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/quotes/${quote.quoteNumber}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label={`View ${quote.quoteNumber}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} quotes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>

    <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this quote?</DialogTitle>
          <DialogDescription>
            {deleteTarget ? `${deleteTarget.quoteNumber} · ${deleteTarget.quoteName} will be permanently removed.` : null}
            {" "}This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
