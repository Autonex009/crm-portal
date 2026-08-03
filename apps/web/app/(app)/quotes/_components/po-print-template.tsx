"use client";

import React from "react";
import Image from "next/image";
import { formatQuoteCurrency } from "./use-quote-builder";
import type { PO5ColumnItem } from "./quote-template-schemas";

export interface POPrintTemplateProps {
  poNumber: string;
  poDate: string;
  deliveryDate?: string;
  paymentTerms?: string;
  placeOfDelivery?: string;
  preparedBy: string;

  // Vendor / Client Info
  vendorName: string;
  contactPerson?: string;
  vendorAddress?: string;
  vendorGSTIN?: string;
  vendorPhone?: string;
  vendorEmail?: string;

  // Line items
  items: PO5ColumnItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;

  // Optional scope or extra T&C notes
  notes?: string[];
}

export function POPrintTemplate({
  poNumber,
  poDate,
  deliveryDate = "As per schedule",
  paymentTerms = "50% advance, balance 15 days",
  placeOfDelivery = "As specified in agreement",
  preparedBy,
  vendorName,
  contactPerson = "—",
  vendorAddress = "—",
  vendorGSTIN = "—",
  vendorPhone = "—",
  vendorEmail = "—",
  items,
  subtotal,
  taxRate,
  taxAmount,
  grandTotal,
  notes,
}: POPrintTemplateProps) {
  return (
    <div
      id="po-print-area"
      className="mx-auto w-[210mm] min-h-[297mm] print:min-h-0 print:h-auto bg-white p-5 text-black shadow-lg print:w-full print:p-2 print:shadow-none font-sans leading-tight text-[10.5px]"
    >
      {/* 1. Header with Logo & Company Legal Bar */}
      <div className="border-b border-black pb-1.5 mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="relative h-10 w-44">
            <Image
              src="/autonex-po-logo.png"
              alt="AUTONEX AI"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="text-right text-[10px] leading-tight text-gray-700">
            <p className="font-bold text-gray-900">AUTONEX AI 360 PRIVATE LIMITED</p>
            <p>CIN: U62099MH2025PTC453218 | GSTIN: 27ABDCA3903H1ZX</p>
          </div>
        </div>
        <p className="text-[9.5px] text-gray-600 text-center border-t border-gray-200 pt-0.5">
          908, Lodha Supremus, Saki Vihar Road, Powai - 400072, Maharashtra, India
        </p>
      </div>

      {/* 2. Document Title */}
      <div className="text-center my-1.5">
        <h1 className="text-base font-bold tracking-wider text-black uppercase">
          PURCHASE ORDER (PO)
        </h1>
      </div>

      {/* 3. Info Grid Table (7 rows x 4 cols) */}
      <table className="w-full border-collapse border border-black text-[10px] mb-2 print-avoid-break">
        <tbody>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold w-1/6">Vendor Name</td>
            <td className="border border-black py-0.5 px-1.5 w-2/6">{vendorName}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold w-1/6">PO No.</td>
            <td className="border border-black py-0.5 px-1.5 font-mono font-bold w-2/6">{poNumber}</td>
          </tr>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Contact Person</td>
            <td className="border border-black py-0.5 px-1.5">{contactPerson}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">PO Date</td>
            <td className="border border-black py-0.5 px-1.5">{poDate}</td>
          </tr>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Vendor Address</td>
            <td className="border border-black py-0.5 px-1.5">{vendorAddress}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Delivery Date</td>
            <td className="border border-black py-0.5 px-1.5">{deliveryDate}</td>
          </tr>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Vendor GSTIN</td>
            <td className="border border-black py-0.5 px-1.5 font-mono">{vendorGSTIN}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Payment Terms</td>
            <td className="border border-black py-0.5 px-1.5">{paymentTerms}</td>
          </tr>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Contact No.</td>
            <td className="border border-black py-0.5 px-1.5">{vendorPhone}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Place of Delivery</td>
            <td className="border border-black py-0.5 px-1.5">{placeOfDelivery}</td>
          </tr>
          <tr>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Email ID</td>
            <td className="border border-black py-0.5 px-1.5">{vendorEmail}</td>
            <td className="border border-black bg-gray-100 py-0.5 px-1.5 font-semibold">Prepared By</td>
            <td className="border border-black py-0.5 px-1.5">{preparedBy}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Line Items Table (5 Columns) */}
      <table className="w-full border-collapse border border-black text-[10px] mb-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black py-0.5 px-1.5 text-center w-[8%]">Sr. No.</th>
            <th className="border border-black py-0.5 px-1.5 text-left w-[47%]">Description</th>
            <th className="border border-black py-0.5 px-1.5 text-center w-[10%]">Qty</th>
            <th className="border border-black py-0.5 px-1.5 text-right w-[17.5%]">Unit Price (₹)</th>
            <th className="border border-black py-0.5 px-1.5 text-right w-[17.5%]">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="align-top print-avoid-break">
              <td className="border border-black py-0.5 px-1.5 text-center font-medium">{item.srNo}</td>
              <td className="border border-black py-0.5 px-1.5 whitespace-pre-wrap leading-tight text-[9.5px]">
                {item.description}
              </td>
              <td className="border border-black py-0.5 px-1.5 text-center font-medium">{item.qty}</td>
              <td className="border border-black py-0.5 px-1.5 text-right font-mono">
                {formatQuoteCurrency(item.unitPrice)}
              </td>
              <td className="border border-black py-0.5 px-1.5 text-right font-mono">
                {formatQuoteCurrency(item.amount)}
              </td>
            </tr>
          ))}

          {/* Subtotal */}
          <tr className="print-avoid-break">
            <td colSpan={4} className="border border-black py-0.5 px-1.5 text-right font-semibold bg-gray-50">
              Sub Total
            </td>
            <td className="border border-black py-0.5 px-1.5 text-right font-mono font-semibold">
              {formatQuoteCurrency(subtotal)}
            </td>
          </tr>

          {/* GST */}
          <tr className="print-avoid-break">
            <td colSpan={4} className="border border-black py-0.5 px-1.5 text-right font-semibold bg-gray-50">
              GST ({taxRate}%)
            </td>
            <td className="border border-black py-0.5 px-1.5 text-right font-mono font-semibold">
              {formatQuoteCurrency(taxAmount)}
            </td>
          </tr>

          {/* Grand Total */}
          <tr className="bg-gray-100 font-bold print-avoid-break">
            <td colSpan={4} className="border border-black py-0.5 px-1.5 text-right text-[11px]">
              Grand Total
            </td>
            <td className="border border-black py-0.5 px-1.5 text-right font-mono text-[11px]">
              {formatQuoteCurrency(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Terms / Notes (if any) */}
      {notes && notes.length > 0 && (
        <div className="mb-2 border border-gray-300 p-2 rounded text-[9.5px] bg-gray-50 print-avoid-break">
          <p className="font-bold mb-0.5 text-[10px]">Notes & Scope Details:</p>
          <ul className="list-disc pl-3.5 space-y-0.5 text-gray-800 leading-tight">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Authorized Signatory Block & Execution */}
      <div className="mt-2 pt-2 border-t border-black text-[10px] flex justify-between items-end print-avoid-break">
        <div className="w-1/2 space-y-0.5">
          <p className="font-bold text-gray-900">Execution / Acceptance:</p>
          <p>By: <span className="border-b border-black inline-block w-36 ml-1">Nikhil Gawade</span></p>
          <p>Title: <span className="border-b border-black inline-block w-36 ml-1">Founder & CEO</span></p>
          <p className="text-[9px] text-gray-500 pt-0.5">Autonex AI 360 Private Limited</p>
        </div>

        <div className="w-1/2 text-right space-y-0.5">
          <p className="font-bold uppercase text-gray-900">Authorized Signatory</p>
          <p className="font-semibold text-gray-800">AUTONEX AI 360 PRIVATE LIMITED</p>

          <div className="flex justify-end my-0.5">
            <div className="relative h-16 w-20 border border-dashed border-gray-300 rounded p-0.5">
              <Image
                src="/autonex-seal.jpg"
                alt="Company Seal"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div>
            <p className="font-bold">NIKHIL SUNIL GAWADE</p>
            <p className="text-gray-600">Director</p>
            <p className="text-gray-500 text-[9px]">DIN: 11217265</p>
          </div>
        </div>
      </div>

      {/* 7. Footer */}
      <div className="mt-2 pt-1 border-t border-gray-300 text-[9px] text-gray-500 flex justify-between items-center print-avoid-break">
        <span>AUTONEX AI 360 PRIVATE LIMITED</span>
        <span className="font-semibold">| Confidential</span>
      </div>
    </div>
  );
}
