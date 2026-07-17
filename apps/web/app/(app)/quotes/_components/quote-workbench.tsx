"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  Pencil,
  Printer,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { QUOTE_STATUS_STEPS, type QuoteRecord, type QuoteStatus } from "./quote-module-data";
import { formatQuoteCurrency, getStatusStepIndex, useQuoteBuilder } from "./use-quote-builder";

function getStatusTone(status: QuoteStatus): "gray" | "info" | "success" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Draft":
      return "gray";
    case "Presented":
      return "info";
    case "Accepted":
      return "success";
    case "Closed":
      return "secondary";
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/80 p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function FinancialSummary({
  subtotal,
  taxAmount,
  grandTotal,
}: {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}) {
  return (
    <div className="ml-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-950 text-slate-50 shadow-sm">
      <div className="border-b border-slate-800 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Financial Summary</p>
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Subtotal</span>
          <span className="font-medium text-slate-50">{formatQuoteCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Tax Amount (8.5%)</span>
          <span className="font-medium text-slate-50">{formatQuoteCurrency(taxAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-base font-semibold">
          <span>Grand Total</span>
          <span>{formatQuoteCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export function QuoteWorkbench({
  initialQuote,
  onQuoteChange,
}: {
  initialQuote?: QuoteRecord;
  onQuoteChange?: (quote: QuoteRecord) => void;
} = {}) {
  const router = useRouter();
  const { quote, schema, costLines, financialSummary, isLocked, updateStatus, convertToInvoice } =
    useQuoteBuilder(initialQuote);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const statusStepIndex = getStatusStepIndex(quote.status);

  useEffect(() => {
    onQuoteChange?.(quote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  function handlePrint() {
    window.open(`/quotes/${quote.quoteNumber}/print`, "_blank", "noopener,noreferrer");
  }

  function handleEmailClient() {
    const subject = encodeURIComponent(`Quotation ${quote.quoteNumber}: ${quote.quoteName}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease find quotation ${quote.quoteNumber} for ${quote.quoteName}.\n\nGrand Total: ${formatQuoteCurrency(financialSummary.grandTotal)}\nExpiration Date: ${quote.expirationDate}\n\nRegards,\n${quote.createdBy.name}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleEditDetails() {
    router.push(`/quotes/new?edit=${encodeURIComponent(quote.quoteNumber)}`);
  }

  function handleConvertToInvoice() {
    convertToInvoice();
    setConvertDialogOpen(false);
    toast({
      title: "Quote converted to invoice",
      description: "The record is now closed and locked for historical audit integrity.",
      variant: "success",
    });
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95)_55%,rgba(15,118,110,0.9))] p-6 text-slate-50 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                <FileText className="h-3.5 w-3.5" />
                Quotation Module
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{quote.quoteName}</h1>
                <p className="text-sm text-slate-300">
                  Salesforce-style quoting workspace with live commercial calculations, approval-stage visibility,
                  and invoice conversion controls.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Quote</p>
                    <div className="mt-1 flex items-center gap-3">
                      <p className="text-xl font-semibold">{quote.quoteNumber}</p>
                      <Badge variant={getStatusTone(quote.status)}>{quote.status}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-slate-950/25 px-3 py-2">
                    {QUOTE_STATUS_STEPS.map((status, index) => {
                      const isActive = index === statusStepIndex;
                      const isComplete = index < statusStepIndex;

                      return (
                        <div key={status} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                              isActive && "bg-white text-slate-950",
                              isComplete && !isActive && "bg-emerald-400/20 text-emerald-200",
                              !isActive && !isComplete && "bg-white/5 text-slate-400"
                            )}
                          >
                            {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            <span>{status}</span>
                          </div>
                          {index < QUOTE_STATUS_STEPS.length - 1 ? (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/15 bg-white text-slate-950 hover:bg-slate-100"
                  onClick={handleEditDetails}
                  disabled={isLocked}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Details
                </Button>
                <Button
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print / PDF
                </Button>
                <Button
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                  onClick={handleEmailClient}
                >
                  <Mail className="h-4 w-4" />
                  Email Client
                </Button>
                <Button
                  className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  onClick={() => setConvertDialogOpen(true)}
                  disabled={isLocked}
                >
                  <Receipt className="h-4 w-4" />
                  Convert to Invoice
                </Button>
              </div>
            </div>
          </div>
        </section>

        {isLocked ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Historical ledger locked</p>
              <p className="text-sm text-emerald-800">
                This quote was closed during invoice conversion. Editing is permanently disabled to preserve audit integrity.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Header Information</p>
                  <h2 className="mt-1 text-lg font-semibold">Commercial overview</h2>
                </div>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <KeyValueRow label="Quote Number" value={quote.quoteNumber} />
                <KeyValueRow label="Quote Name" value={quote.quoteName} />
                <KeyValueRow
                  label="Opportunity"
                  value={<Link href={quote.opportunity.href} className="text-primary hover:underline">{quote.opportunity.label}</Link>}
                />
                <KeyValueRow
                  label="Account"
                  value={<Link href={quote.account.href} className="text-primary hover:underline">{quote.account.label}</Link>}
                />
                <KeyValueRow
                  label="Expiration Date"
                  value={new Date(quote.expirationDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
                <KeyValueRow label="Status" value={<Badge variant={getStatusTone(quote.status)}>{quote.status}</Badge>} />
                <KeyValueRow
                  label="Created By"
                  value={
                    <div className="space-y-1">
                      <p>{quote.createdBy.name}</p>
                      <p className="text-sm font-normal text-muted-foreground">{quote.createdBy.role} · {quote.createdBy.email}</p>
                    </div>
                  }
                />
                <KeyValueRow
                  label="Created On"
                  value={new Date(quote.createdBy.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                />
              </div>
            </section>

            <section className="rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Cost Line Items</p>
                  <h2 className="mt-1 text-lg font-semibold">Pricing matrix</h2>
                </div>
              </div>
              <div className="p-2 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="align-top hover:bg-transparent">
                      <TableHead>Sr. No.</TableHead>
                      <TableHead>Type of cost</TableHead>
                      <TableHead>Services included</TableHead>
                      <TableHead className="text-right">QTY</TableHead>
                      <TableHead className="text-right">{schema.amountColumnLabel}</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Final price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costLines.map((line) => (
                      <TableRow key={line.id} className="align-top">
                        <TableCell>{line.srNo}</TableCell>
                        <TableCell className="font-medium">{line.typeOfCost}</TableCell>
                        <TableCell>
                          <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                            {line.servicesIncluded.map((service, index) => (
                              <li key={index}>{service}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{line.qty}</TableCell>
                        <TableCell className="text-right font-medium">{formatQuoteCurrency(line.amountPerUnit)}</TableCell>
                        <TableCell className="text-right">{line.discountPercent}%</TableCell>
                        <TableCell className="text-right font-medium">{formatQuoteCurrency(line.finalPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatQuoteCurrency(line.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workflow</p>
              <div className="mt-4 space-y-3">
                {QUOTE_STATUS_STEPS.map((status, index) => {
                  const isActive = index === statusStepIndex;
                  const isComplete = index < statusStepIndex;

                  return (
                    <div
                      key={status}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3",
                        isActive && "border-primary/40 bg-primary/5",
                        isComplete && "border-emerald-200 bg-emerald-50",
                        !isActive && !isComplete && "border-border/70"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                          isActive && "bg-primary text-primary-foreground",
                          isComplete && "bg-emerald-500 text-white",
                          !isActive && !isComplete && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{status}</p>
                        <p className="text-xs text-muted-foreground">
                          {status === "Draft" && "Editable internal preparation"}
                          {status === "Presented" && "Shared with client for review"}
                          {status === "Accepted" && "Commercial approval secured"}
                          {status === "Closed" && "Invoice generated and record locked"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <FinancialSummary
              subtotal={financialSummary.subtotal}
              taxAmount={financialSummary.taxAmount}
              grandTotal={financialSummary.grandTotal}
            />

            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Next Recommended Action</p>
              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <p className="font-medium">
                  {isLocked
                    ? "Invoice follow-up only"
                    : quote.status === "Draft"
                      ? "Finalize pricing and save the draft."
                      : quote.status === "Presented"
                        ? "Track client feedback, then mark as Accepted."
                        : "Convert the approved quote into an invoice."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isLocked
                    ? "The quote can still be printed or emailed, but no financial edits remain available."
                    : "This guidance is derived from the current workflow stage and commercial lock rules."}
                </p>
                {!isLocked && quote.status !== "Closed" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {quote.status === "Draft" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateStatus("Presented");
                          toast({ title: "Status updated", description: "Quote is now marked as Presented.", variant: "success" });
                        }}
                      >
                        Present Quote
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {quote.status === "Presented" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateStatus("Accepted");
                          toast({ title: "Status updated", description: "Quote is now marked as Accepted.", variant: "success" });
                        }}
                      >
                        Mark Accepted
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {quote.status === "Accepted" ? (
                      <Button size="sm" onClick={() => setConvertDialogOpen(true)}>
                        Convert Now
                        <Receipt className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert quote to invoice?</DialogTitle>
            <DialogDescription>
              This action will set the quote status to Closed and permanently disable every editing path on the record.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Use this only when the commercial terms are finalized. After conversion, the quote becomes a read-only ledger for audit history.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToInvoice}>
              Confirm Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
