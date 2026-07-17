"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Manrope, Montserrat } from "next/font/google";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteBrandMark, QuoteMark } from "./quote-brand-mark";
import {
  CATEGORY_TEMPLATE_SCHEMAS,
  interpolateDerivedLine,
  resolveCostLines,
  resolveTemplateTitle,
  roundCurrency,
  type CostLineComputed,
} from "./quote-template-schemas";
import type { QuoteRecord } from "./quote-module-data";
import { formatQuoteCurrency } from "./use-quote-builder";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"] });

const TAX_RATE = 0.085;

// Matches the reference quotation PDF: light-blue header fill, navy text and
// grid lines for the cost table (everything outside the table is plain black).
const TABLE_HEADER_BG = "#DCE6F1";
const TABLE_TEXT_COLOR = "#073763";
const TABLE_BORDER_COLOR = "#0B5394";

// Each printed page is a full A4 sheet (210mm x 297mm) with an inner padding
// standing in for the page margin, and @page margin is set to 0 so the
// browser doesn't add a second margin on top of it.
const MM_TO_PX = 96 / 25.4;
const PAGE_MARGIN_MM = 18;
const PAGE_CONTENT_HEIGHT_PX = Math.round((297 - PAGE_MARGIN_MM * 2) * MM_TO_PX);
const FOOTER_RESERVE_PX = 40;
const USABLE_HEIGHT_PX = PAGE_CONTENT_HEIGHT_PX - FOOTER_RESERVE_PX;

// Greedily bin-packs blocks (in order) into pages of at most `usableHeight`.
// A block that's the first thing on a page is always kept even if it alone
// overflows — splitting a single block further isn't supported.
function packBlocks(heights: number[], usableHeight: number): number[][] {
  const pages: number[][] = [[]];
  let remaining = usableHeight;

  heights.forEach((height, index) => {
    const currentPage = pages[pages.length - 1];
    if (height > remaining && currentPage.length > 0) {
      pages.push([]);
      remaining = usableHeight;
    }
    pages[pages.length - 1].push(index);
    remaining -= height;
  });

  return pages;
}

function CostLineTable({
  columns,
  lines,
}: {
  columns: { key: string; label: string; align?: "left" | "right"; widthPercent?: number }[];
  lines: CostLineComputed[];
}) {
  return (
    <table
      className="w-full border-collapse text-[9px]"
      style={{ color: TABLE_TEXT_COLOR, borderColor: TABLE_BORDER_COLOR }}
    >
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={{ width: column.widthPercent ? `${column.widthPercent}%` : undefined }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: TABLE_HEADER_BG }}>
          {columns.map((column) => (
            <th
              key={column.key}
              className="border px-2 py-1.5 text-center font-bold"
              style={{ borderColor: TABLE_BORDER_COLOR }}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="align-top" style={{ breakInside: "avoid" }}>
            <td className="border px-2 py-1.5 text-center" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {line.srNo}
            </td>
            <td className="border px-2 py-1.5 font-bold" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {line.typeOfCost}
            </td>
            <td className="border px-2 py-1.5" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {line.servicesIncluded.map((service, index) => (
                <p key={index}>- {service}</p>
              ))}
            </td>
            <td className="border px-2 py-1.5 text-center tabular-nums" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {line.qty}
            </td>
            <td className="border px-2 py-1.5 text-right tabular-nums" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {formatQuoteCurrency(line.amountPerUnit)}
            </td>
            <td className="border px-2 py-1.5 text-right tabular-nums" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {line.discountPercent}%
            </td>
            <td className="border px-2 py-1.5 text-right tabular-nums" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {formatQuoteCurrency(line.finalPrice)}
            </td>
            <td className="border px-2 py-1.5 text-right font-semibold tabular-nums" style={{ borderColor: TABLE_BORDER_COLOR }}>
              {formatQuoteCurrency(line.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// "YYYY-MM-DD" (native <input type="date"> value) -> "DD/MM/YYYY" for print.
function formatPrintDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

// Renders one blank-line-separated block of free text: the first line is
// bolded (up to its colon, or the whole line if there's no colon) as the
// heading, any remaining lines render as plain text below it.
function TermsBlock({ text }: { text: string }) {
  const [firstLine, ...restLines] = text.split("\n");
  const colonIndex = firstLine.indexOf(":");
  const heading = colonIndex === -1 ? firstLine : firstLine.slice(0, colonIndex + 1);
  const inlineRest = colonIndex === -1 ? "" : firstLine.slice(colonIndex + 1);

  return (
    <p className="mb-2">
      <span className="font-bold">{heading}</span>
      {inlineRest}
      {restLines.map((line, index) => (
        <span key={index} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

export function QuotePrintPreview({ quote }: { quote: QuoteRecord }) {
  const router = useRouter();
  const categoryTemplate = quote.categoryTemplate;
  const schema = CATEGORY_TEMPLATE_SCHEMAS[quote.productCategory];

  const costLines = resolveCostLines(schema, categoryTemplate);
  const subtotal = roundCurrency(costLines.reduce((sum, line) => sum + line.total, 0));
  const taxAmount = roundCurrency(subtotal * TAX_RATE);
  const grandTotal = roundCurrency(subtotal + taxAmount);

  function renderHeader() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 pt-10 text-center">
          <QuoteBrandMark className="h-10" />
          <h1 className={`${montserrat.className} text-[13px] font-bold`}>
            {resolveTemplateTitle(schema, categoryTemplate.reference)}
          </h1>
        </div>
        <div className="space-y-2 text-[9px]">
          <p>Date - {formatPrintDate(categoryTemplate.date)}</p>
          {schema.headerFields.map((field) => (
            <div key={field.key}>
              <p>{field.label}</p>
              <p className="pl-2">{categoryTemplate.headerFieldValues[field.key]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderScope() {
    return (
      <div>
        <p className="text-[9px] font-bold">{schema.scopeHeading}</p>
        <div className="mt-3 space-y-2 text-[9px]">
          {categoryTemplate.scopeDerivedLines.length > 0 ? (
            <div>
              {categoryTemplate.scopeDerivedLines.map((line, index) => (
                <p key={index}>{interpolateDerivedLine(line, categoryTemplate.headerFieldValues)}</p>
              ))}
            </div>
          ) : null}
          {schema.scopeFields.map((field) => (
            <p key={field.key} className="whitespace-pre-line">
              {categoryTemplate.scopeFieldValues[field.key]}
            </p>
          ))}
          {categoryTemplate.customFields.map((field) => (
            <p key={field.id}>
              <span className="font-bold">{field.label}: </span>
              {field.value}
            </p>
          ))}
        </div>
      </div>
    );
  }

  function renderCostItems() {
    return (
      <div>
        <CostLineTable columns={schema.costLineColumns} lines={costLines} />

        <div className="ml-auto mt-3 w-56 space-y-1 border-t border-slate-900 pt-2 text-[9px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatQuoteCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8.5%)</span>
            <span>{formatQuoteCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-400 pt-1 font-bold">
            <span>Grand Total</span>
            <span>{formatQuoteCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderTerms() {
    return (
      <div className="space-y-2 text-[7px] leading-[1.5]">
        {categoryTemplate.footerSections.map((section) =>
          section.body.includes("\n") ? (
            <div key={section.heading}>
              {section.body.split("\n\n").map((block, blockIndex) => (
                <TermsBlock key={blockIndex} text={block} />
              ))}
            </div>
          ) : (
            <p key={section.heading}>
              <span className="font-bold">{section.heading}: </span>
              {section.body}
            </p>
          )
        )}
      </div>
    );
  }

  const blockRenderers = [renderHeader, renderScope, renderCostItems, renderTerms];

  const headerRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const costRef = useRef<HTMLDivElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const blockRefs = [headerRef, scopeRef, costRef, termsRef];

  const [pages, setPages] = useState<number[][] | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const heights = blockRefs.map((ref) => ref.current?.offsetHeight ?? 0);
      setPages(packBlocks(heights, USABLE_HEIGHT_PX));
    }

    measure();
    const observer = new ResizeObserver(measure);
    blockRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  return (
    <div className={`${manrope.className} min-h-screen bg-muted/40 py-8 text-slate-900 print:bg-white print:py-0`}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .quote-print-page { box-shadow: none !important; break-after: page; }
          .quote-print-page:last-child { break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between px-2">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back to quote
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Hidden measuring pass: same width/padding as a real page so heights match exactly. */}
      <div
        aria-hidden="true"
        className="invisible absolute left-0 top-0 w-[210mm]"
        style={{ pointerEvents: "none", padding: `${PAGE_MARGIN_MM}mm` }}
      >
        <div className="space-y-6">
          <div ref={headerRef}>{renderHeader()}</div>
          <div ref={scopeRef}>{renderScope()}</div>
          <div ref={costRef}>{renderCostItems()}</div>
          <div ref={termsRef}>{renderTerms()}</div>
        </div>
      </div>

      {pages ? (
        <div className="mx-auto flex w-[210mm] flex-col gap-8 print:gap-0">
          {pages.map((blockIndices, pageIndex) => (
            <div
              key={pageIndex}
              className="quote-print-page relative flex w-[210mm] flex-col bg-white shadow-xl"
              style={{ minHeight: "297mm", padding: `${PAGE_MARGIN_MM}mm` }}
            >
              <div className="flex-1 space-y-6">
                {blockIndices.map((blockIndex) => (
                  <div key={blockIndex}>{blockRenderers[blockIndex]()}</div>
                ))}
              </div>
              <div className="mt-6 flex items-end justify-between text-[7px] text-slate-500">
                <span>{pages.length > 1 ? `Page ${pageIndex + 1} of ${pages.length}` : null}</span>
                <QuoteMark className="h-4 w-4 opacity-90" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
