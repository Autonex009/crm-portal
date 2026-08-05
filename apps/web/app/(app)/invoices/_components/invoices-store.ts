"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InvoiceRecord, SAMPLE_INVOICE_DATA } from "./invoice-types";

interface InvoicesState {
  invoices: InvoiceRecord[];
  addInvoice: (invoice: InvoiceRecord) => void;
  updateInvoiceStatus: (id: string, status: InvoiceRecord["status"]) => void;
  getInvoice: (idOrNumber: string) => InvoiceRecord | undefined;
}

export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      invoices: [SAMPLE_INVOICE_DATA],
      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [invoice, ...state.invoices.filter((i) => i.id !== invoice.id && i.invoiceNumber !== invoice.invoiceNumber)],
        })),
      updateInvoiceStatus: (id, status) =>
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
        })),
      getInvoice: (idOrNumber) => {
        const decoded = decodeURIComponent(idOrNumber);
        return get().invoices.find((i) => i.id === decoded || i.invoiceNumber === decoded);
      },
    }),
    {
      name: "autonex-invoices-storage",
    }
  )
);
