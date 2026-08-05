"use client";

import Image from "next/image";
import { InvoiceRecord, numberToIndianWords } from "./invoice-types";

function formatCurrency(val: number): string {
  if (val === 0) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(val);
}

export function InvoicePrintTemplate({ invoice }: { invoice: InvoiceRecord }) {
  const amountInWords = numberToIndianWords(invoice.grandTotal);

  return (
    <div
      id="invoice-print-area"
      className="mx-auto w-[210mm] max-w-full bg-white text-slate-950 font-serif text-[9.5px] leading-tight p-2 sm:p-4 shadow-lg print:shadow-none print:p-0 print:m-0 print:w-full"
    >
      {/* Top Black AUTONEX Logo Banner */}
      <div className="mb-1 flex justify-center">
        <div className="bg-black text-white px-5 py-1 text-center text-xs font-bold tracking-widest uppercase rounded-xs">
          AUTONEX
        </div>
      </div>

      {/* Main Outer Box */}
      <div className="border border-slate-800">
        {/* Title Bar */}
        <div className="border-b border-slate-800 bg-blue-50/60 py-1 text-center font-bold text-xs tracking-wider text-blue-900 uppercase">
          GST TAX INVOICE
        </div>

        {/* 1. Header Section: Issuer Info & Invoice Number/Date */}
        <div className="grid grid-cols-12 border-b border-slate-800 p-2 gap-2 text-[9.5px]">
          <div className="col-span-7 space-y-0.5">
            <p className="text-xs font-bold text-black">{invoice.issuerName}</p>
            <p className="text-slate-700">{invoice.issuerAddress}</p>
            <p className="text-slate-700">Contact- {invoice.issuerContact}</p>
            <p className="text-blue-700 underline">{invoice.issuerEmail}</p>
            <div className="pt-1 font-bold text-black flex flex-wrap gap-x-4">
              <span>GSTIN: {invoice.issuerGSTIN}</span>
              <span>PAN: {invoice.issuerPAN}</span>
            </div>
          </div>

          <div className="col-span-5 text-right space-y-1 self-start font-semibold text-black">
            <p>
              Invoice No. : <span className="font-mono font-bold text-xs">{invoice.invoiceNumber}</span>
            </p>
            <p>Invoice Date : <span className="font-normal">{invoice.invoiceDate}</span></p>
          </div>
        </div>

        {/* 2. Bill To Section */}
        <div className="border-b border-slate-800 p-2 space-y-0.5 text-[9.5px] bg-slate-50/30">
          <p className="font-bold text-black uppercase tracking-wider text-[9px] text-slate-500">Bill To:</p>
          <p className="text-xs font-bold text-black">{invoice.clientName}</p>
          <p className="text-slate-800">
            {invoice.clientAddress}
            {invoice.clientCIN ? ` CIN No:${invoice.clientCIN}` : ""}
          </p>
          <p className="text-slate-800">Contact: {invoice.clientContact}</p>
          <p className="font-bold text-black pt-0.5">GSTIN: {invoice.clientGSTIN}</p>
        </div>

        {/* 3. Multi-Tax Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[9px] text-slate-900 border-b border-slate-800">
            <thead>
              <tr className="bg-slate-100 font-semibold border-b border-slate-800 text-center">
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-[4%]">
                  Sr. No.
                </th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 text-left w-[32%]">
                  Name of Product / Service
                </th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-[11%]">
                  HSN / SAC
                </th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-[4%]">
                  QTY
                </th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 text-right w-[8%]">
                  Amount Per piece
                </th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 text-right w-[9%]">
                  Taxable Value
                </th>
                <th colSpan={2} className="border-r border-slate-800 p-0.5">
                  CGST
                </th>
                <th colSpan={2} className="border-r border-slate-800 p-0.5">
                  SGST
                </th>
                <th colSpan={2} className="border-r border-slate-800 p-0.5">
                  IGST
                </th>
                <th rowSpan={2} className="p-1 text-right w-[9%]">
                  Total
                </th>
              </tr>
              <tr className="bg-slate-100 font-semibold border-b border-slate-800 text-center text-[8.5px]">
                <th className="border-r border-slate-800 p-0.5 w-[4%]">Rate</th>
                <th className="border-r border-slate-800 p-0.5 w-[6%]">Amount</th>
                <th className="border-r border-slate-800 p-0.5 w-[4%]">Rate</th>
                <th className="border-r border-slate-800 p-0.5 w-[6%]">Amount</th>
                <th className="border-r border-slate-800 p-0.5 w-[4%]">Rate</th>
                <th className="border-r border-slate-800 p-0.5 w-[6%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                if (item.isGroupHeader) {
                  return (
                    <tr key={idx} className="bg-slate-50/80 font-bold italic border-b border-slate-300">
                      <td className="border-r border-slate-800 p-1 text-center">{item.srNo}</td>
                      <td className="border-r border-slate-800 p-1 text-left font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="border-r border-slate-800 p-1 text-center font-mono text-[8.5px]">
                        {item.hsnSac}
                      </td>
                      <td className="border-r border-slate-800 p-1 text-center">{item.qty}</td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="border-r border-slate-800 p-1"></td>
                      <td className="p-1"></td>
                    </tr>
                  );
                }

                return (
                  <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/40">
                    <td className="border-r border-slate-800 p-1 text-center">{item.srNo}</td>
                    <td className="border-r border-slate-800 p-1 text-left">{item.description}</td>
                    <td className="border-r border-slate-800 p-1 text-center font-mono text-[8.5px]">
                      {item.hsnSac || "-"}
                    </td>
                    <td className="border-r border-slate-800 p-1 text-center font-semibold">{item.qty}</td>
                    <td className="border-r border-slate-800 p-1 text-right font-mono">
                      {item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "-"}
                    </td>
                    <td className="border-r border-slate-800 p-1 text-right font-mono font-semibold">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="border-r border-slate-800 p-1 text-center">{item.cgstRate}%</td>
                    <td className="border-r border-slate-800 p-1 text-right font-mono">
                      {formatCurrency(item.cgstAmount)}
                    </td>
                    <td className="border-r border-slate-800 p-1 text-center">{item.sgstRate}%</td>
                    <td className="border-r border-slate-800 p-1 text-right font-mono">
                      {formatCurrency(item.sgstAmount)}
                    </td>
                    <td className="border-r border-slate-800 p-1 text-center">{item.igstRate}%</td>
                    <td className="border-r border-slate-800 p-1 text-right font-mono">
                      {formatCurrency(item.igstAmount)}
                    </td>
                    <td className="p-1 text-right font-mono font-bold">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-slate-100 font-bold border-t border-slate-800">
                <td colSpan={5} className="border-r border-slate-800 p-1 text-right uppercase tracking-wider">
                  Total :
                </td>
                <td className="border-r border-slate-800 p-1 text-right font-mono">
                  {formatCurrency(invoice.totalBeforeTax)}
                </td>
                <td className="border-r border-slate-800 p-1"></td>
                <td className="border-r border-slate-800 p-1 text-right font-mono">
                  {formatCurrency(invoice.cgstTotal)}
                </td>
                <td className="border-r border-slate-800 p-1"></td>
                <td className="border-r border-slate-800 p-1 text-right font-mono">
                  {formatCurrency(invoice.sgstTotal)}
                </td>
                <td className="border-r border-slate-800 p-1"></td>
                <td className="border-r border-slate-800 p-1 text-right font-mono">
                  {formatCurrency(invoice.igstTotal)}
                </td>
                <td className="p-1 text-right font-mono text-xs text-blue-900">
                  {formatCurrency(invoice.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Bottom Block: Words + Bank Details + Tax Summary Table + Signatory */}
        <div className="grid grid-cols-12 text-[9px] print-avoid-break">
          {/* Left Column: Words, Bank Details, Terms */}
          <div className="col-span-7 border-r border-slate-800 p-2 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="font-bold text-slate-700">Total Invoice Amount in Words:</p>
              <p className="font-bold text-black text-[9.5px] italic bg-slate-50 p-1.5 rounded-xs border border-slate-200">
                {amountInWords}
              </p>
            </div>

            <div className="space-y-0.5 text-slate-900">
              <p className="font-bold text-black uppercase tracking-wider text-[8.5px] text-slate-500">Bank Details :</p>
              <p>• Name of Bank : <span className="font-semibold">{invoice.bankName}</span></p>
              <p>• Bank Branch : <span className="font-semibold">{invoice.bankBranch}</span></p>
              <p>• Bank Account Number : <span className="font-mono font-bold">{invoice.accountNumber}</span></p>
              <p>• Bank Branch IFSC : <span className="font-mono font-bold">{invoice.ifscCode}</span></p>
            </div>

            <div className="space-y-0.5 pt-1 text-[8.5px] text-slate-700 border-t border-slate-200">
              <p className="font-bold text-black">Terms and Conditions :</p>
              <p>
                1. We declare that this invoice shows the actual price of the goods/services described and that all
                particulars are true and correct
              </p>
            </div>
          </div>

          {/* Right Column: Tax Summary Table + Signatory */}
          <div className="col-span-5 flex flex-col justify-between">
            {/* Tax Summary Table */}
            <table className="w-full border-collapse text-[9px]">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-1 font-semibold text-slate-800 w-2/3 border-r border-slate-300">
                    Total Amount Before Tax :
                  </td>
                  <td className="p-1 text-right font-mono font-bold w-1/3">
                    {formatCurrency(invoice.totalBeforeTax)}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-slate-700 border-r border-slate-300">Add : CGST :</td>
                  <td className="p-1 text-right font-mono">{formatCurrency(invoice.cgstTotal)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-slate-700 border-r border-slate-300">Add : SGST :</td>
                  <td className="p-1 text-right font-mono">{formatCurrency(invoice.sgstTotal)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-slate-700 border-r border-slate-300">Add : IGST :</td>
                  <td className="p-1 text-right font-mono">{formatCurrency(invoice.igstTotal)}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-slate-50 font-semibold">
                  <td className="p-1 text-black border-r border-slate-300">Tax Amount : GST :</td>
                  <td className="p-1 text-right font-mono text-black">{formatCurrency(invoice.taxTotal)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-slate-700 border-r border-slate-300">Round off</td>
                  <td className="p-1 text-right font-mono">{invoice.roundOff}</td>
                </tr>
                <tr className="border-b border-slate-800 bg-blue-50/80 text-xs font-bold text-blue-950">
                  <td className="p-1 border-r border-slate-300">Grand Total (Incl.GST) :</td>
                  <td className="p-1 text-right font-mono">{formatCurrency(invoice.grandTotal)}</td>
                </tr>
                <tr className="border-b border-slate-800 text-[8.5px]">
                  <td className="p-1 text-slate-700 border-r border-slate-300">GST Payable on Reverse Charge</td>
                  <td className="p-1 text-right font-semibold">No</td>
                </tr>
              </tbody>
            </table>

            {/* Authorised Signatory Block */}
            <div className="p-2 text-center space-y-1 mt-2">
              <p className="font-bold text-[9px] text-black">For {invoice.issuerName}</p>

              {/* Digital Seal Graphic */}
              <div className="relative mx-auto my-1 h-14 w-20 flex items-center justify-center">
                <Image
                  src="/autonex-seal.jpg"
                  alt="Company Seal & Signature"
                  width={80}
                  height={56}
                  className="object-contain max-h-full max-w-full"
                />
              </div>

              <p className="font-bold text-[9px] text-black border-t border-slate-400 pt-0.5 inline-block px-4">
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
