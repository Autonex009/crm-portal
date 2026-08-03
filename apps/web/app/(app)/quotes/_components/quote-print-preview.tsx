"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_TEMPLATE_SCHEMAS,
  mapCostLinesToPO5Column,
  resolveCostLines,
  roundCurrency,
} from "./quote-template-schemas";
import type { QuoteRecord } from "./quote-module-data";
import { POPrintTemplate } from "./po-print-template";

export function QuotePrintPreview({ quote }: { quote: QuoteRecord }) {
  const router = useRouter();

  const categoryTemplate = quote.categoryTemplate;
  const schema = CATEGORY_TEMPLATE_SCHEMAS[quote.productCategory];

  const costLines = resolveCostLines(schema, categoryTemplate);
  const subtotal = roundCurrency(costLines.reduce((sum, line) => sum + line.total, 0));
  const taxRate = categoryTemplate.taxRate ?? 18;
  const taxAmount = roundCurrency(subtotal * (taxRate / 100));
  const grandTotal = roundCurrency(subtotal + taxAmount);

  const po5Items = mapCostLinesToPO5Column(costLines);

  const notesList = [
    ...(categoryTemplate.scopeFieldValues.engagementSummary
      ? [String(categoryTemplate.scopeFieldValues.engagementSummary)]
      : []),
    ...categoryTemplate.footerSections.map((sec) => `${sec.heading}: ${sec.body}`),
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 5mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, footer, button {
            display: none !important;
          }
          #po-print-area {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .print-avoid-break, tr, table, ul, li {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between px-2">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quote
        </Button>

        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <POPrintTemplate
        poNumber={quote.quoteNumber}
        poDate={categoryTemplate.date}
        preparedBy={quote.createdBy?.name || "Rohan Mehta"}
        vendorName={quote.account?.label || categoryTemplate.reference || "Client Company"}
        items={po5Items}
        subtotal={subtotal}
        taxRate={taxRate}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        notes={notesList}
      />
    </div>
  );
}
