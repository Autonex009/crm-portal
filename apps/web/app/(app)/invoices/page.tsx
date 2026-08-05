"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Printer, ArrowUpRight, CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoicesStore } from "./_components/invoices-store";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function InvoicesPage() {
  const invoices = useInvoicesStore((state) => state.invoices);
  const updateStatus = useInvoicesStore((state) => state.updateInvoiceStatus);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalTaxable = invoices.reduce((sum, inv) => sum + inv.totalBeforeTax, 0);
  const totalGST = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
  const paidInvoicesCount = invoices.filter((i) => i.status === "Paid").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Receipt className="h-6 w-6 text-primary" />
            Invoices & GST Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track GST Tax Invoices, payment ledgers, and export PDF compliance documents.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total Invoiced
            </span>
            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{formatINR(totalInvoiced)}</div>
          <p className="text-xs text-muted-foreground mt-1">Gross value incl. GST</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Taxable Revenue
            </span>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{formatINR(totalTaxable)}</div>
          <p className="text-xs text-muted-foreground mt-1">Before tax value</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              GST Output Tax
            </span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{formatINR(totalGST)}</div>
          <p className="text-xs text-muted-foreground mt-1">CGST + SGST + IGST</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settled Invoices
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {paidInvoicesCount} / {invoices.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Paid ledgers</p>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b bg-muted/40 py-4 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Tax Invoices Directory</h2>
            <span className="text-xs text-muted-foreground">{invoices.length} Records</span>
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px] font-semibold">Invoice Number</TableHead>
                <TableHead className="font-semibold">Client Company</TableHead>
                <TableHead className="font-semibold">Invoice Date</TableHead>
                <TableHead className="font-semibold text-right">Taxable Value</TableHead>
                <TableHead className="font-semibold text-right">GST Tax</TableHead>
                <TableHead className="font-semibold text-right">Grand Total</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="text-right font-semibold pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono font-bold text-foreground">
                    <Link
                      href={`/invoices/${encodeURIComponent(inv.invoiceNumber)}/print`}
                      className="hover:text-primary hover:underline flex items-center gap-1.5"
                    >
                      {inv.invoiceNumber}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{inv.clientName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{inv.invoiceDate}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-foreground">
                    {formatINR(inv.totalBeforeTax)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-amber-600 dark:text-amber-400">
                    {formatINR(inv.taxTotal)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground text-sm">
                    {formatINR(inv.grandTotal)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        inv.status === "Paid"
                          ? "success"
                          : inv.status === "Pending"
                            ? "warning"
                            : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        updateStatus(
                          inv.id,
                          inv.status === "Paid" ? "Pending" : "Paid"
                        )
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Link href={`/invoices/${encodeURIComponent(inv.invoiceNumber)}/print`}>
                      <Button size="sm" variant="outline" className="h-8 gap-1">
                        <Printer className="h-3.5 w-3.5" />
                        Print / PDF
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
