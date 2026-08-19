"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceRecord } from "./invoice-types";
import { InvoicePrintTemplate } from "./invoice-print-template";

export function InvoicePrintPreview({ invoice }: { invoice: InvoiceRecord }) {
  const router = useRouter();

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
          #invoice-print-area {
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
          Back to Invoices
        </Button>

        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <InvoicePrintTemplate invoice={invoice} />
    </div>
  );
}
