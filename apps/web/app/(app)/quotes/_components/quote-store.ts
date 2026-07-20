"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockQuoteRecord, type QuoteRecord, type QuoteStatus, type ProductCategory } from "./quote-module-data";
import { createDefaultTemplateValues } from "./quote-template-schemas";

function buildSeedQuote(overrides: Partial<QuoteRecord> & { quoteNumber: string }): QuoteRecord {
  return {
    ...mockQuoteRecord,
    categoryTemplate: createDefaultTemplateValues(overrides.productCategory ?? mockQuoteRecord.productCategory),
    ...overrides,
  };
}

function vigilStyleScope(quantity: number) {
  return [
    `Number of cameras covered: ${quantity}`,
    "Use case: Safety compliance monitoring",
    "Detections included: PPE Detections, restricted-zone intrusion, Fire safety, etc. (more details in deck of Autonex AI)",
    "Alert channels included: Dashboard + on-ground speaker alerts + email alerts",
    "Evidence storage: 30 days image-based audit trail",
    "Deployment model: Edge AI processor at site + cloud dashboard",
    "Existing CCTV/NVR feed to be used, subject to RTSP/IP camera compatibility",
  ].join("\n");
}

function masterTemplate(
  reference: string,
  quantity: number,
  scopeNote?: string,
  costLineDiscounts?: Record<number, number>
) {
  const values = createDefaultTemplateValues("Master");
  values.reference = reference;
  values.headerFieldValues.quantity = quantity;
  if (scopeNote) {
    values.scopeFieldValues.engagementSummary = scopeNote;
  }
  if (costLineDiscounts) {
    values.costLines = values.costLines.map((line, index) =>
      costLineDiscounts[index] !== undefined ? { ...line, discountPercent: costLineDiscounts[index] } : line
    );
  }
  return values;
}

function wilTemplate(reference: string, seats: number) {
  const values = createDefaultTemplateValues("WIL");
  values.reference = reference;
  values.headerFieldValues.numberOfSeats = seats;
  return values;
}

const SEED_QUOTES: QuoteRecord[] = [
  buildSeedQuote({
    quoteNumber: "Q-890243",
    quoteName: "FY27 Expansion Proposal",
    status: "Presented",
    productCategory: "Master",
  }),
  buildSeedQuote({
    quoteNumber: "Q-890198",
    quoteName: "Site Safety Monitoring - L&T",
    status: "Accepted",
    productCategory: "Master",
    opportunity: { id: "opp-lt-vigil", label: "L&T Site Safety Rollout", href: "/deals" },
    account: { id: "acct-lt", label: "Larsen & Toubro", href: "/companies" },
    createdBy: {
      name: "Rohan Mehta",
      role: "Solutions Consultant",
      email: "rohan.mehta@autonex.local",
      createdAt: "2026-06-30T09:15:00.000Z",
    },
    categoryTemplate: masterTemplate("L&T", 100, vigilStyleScope(100), { 0: 40 }),
  }),
  buildSeedQuote({
    quoteNumber: "Q-890211",
    quoteName: "WIL quotation - Nimbus Retail",
    status: "Draft",
    productCategory: "WIL",
    opportunity: { id: "opp-nimbus-wil", label: "Nimbus Retail Workforce Pilot", href: "/deals" },
    account: { id: "acct-nimbus", label: "Nimbus Retail Pvt Ltd", href: "/companies" },
    createdBy: {
      name: "Mustafa Ujjainwala",
      role: "Senior Account Executive",
      email: "mustafa.ujjainwala@autonex.local",
      createdAt: "2026-07-10T14:05:00.000Z",
    },
    categoryTemplate: wilTemplate("Nimbus Retail", 40),
  }),
  buildSeedQuote({
    quoteNumber: "Q-890167",
    quoteName: "Site Safety Monitoring - Bhiwadi Plant",
    status: "Rejected",
    productCategory: "Master",
    opportunity: { id: "opp-bhiwadi-vigil", label: "Bhiwadi Plant Surveillance", href: "/deals" },
    account: { id: "acct-autonex-mfg", label: "Autonex Manufacturing Group", href: "/companies" },
    createdBy: {
      name: "Rohan Mehta",
      role: "Solutions Consultant",
      email: "rohan.mehta@autonex.local",
      createdAt: "2026-06-02T11:40:00.000Z",
    },
    categoryTemplate: masterTemplate("Bhiwadi Plant", 22, vigilStyleScope(22)),
  }),
  buildSeedQuote({
    quoteNumber: "Q-890082",
    quoteName: "Renewal Proposal FY26",
    status: "Closed",
    productCategory: "Master",
    opportunity: { id: "opp-enterprise-renewal-fy26", label: "Autonex Enterprise Renewal FY26", href: "/deals" },
    account: { id: "acct-autonex", label: "Autonex Manufacturing Group", href: "/companies" },
    createdBy: {
      name: "Mustafa Ujjainwala",
      role: "Senior Account Executive",
      email: "mustafa.ujjainwala@autonex.local",
      createdAt: "2026-04-18T08:20:00.000Z",
    },
  }),
];

const SEED_QUOTE_NUMBERS = new Set(SEED_QUOTES.map((q) => q.quoteNumber));

interface QuotesStore {
  quotes: QuoteRecord[];
  deletedSeedQuoteNumbers: string[];
  getQuote: (quoteNumber: string) => QuoteRecord | undefined;
  addQuote: (quote: QuoteRecord) => void;
  updateQuote: (quoteNumber: string, quote: QuoteRecord) => void;
  deleteQuote: (quoteNumber: string) => void;
  nextQuoteNumber: () => string;
}

export const useQuotesStore = create<QuotesStore>()(
  persist(
    (set, get) => ({
      quotes: SEED_QUOTES,
      deletedSeedQuoteNumbers: [],
      getQuote: (quoteNumber) => get().quotes.find((q) => q.quoteNumber === quoteNumber),
      addQuote: (quote) => set((state) => ({ quotes: [quote, ...state.quotes] })),
      updateQuote: (quoteNumber, quote) =>
        set((state) => ({
          quotes: state.quotes.map((q) => (q.quoteNumber === quoteNumber ? quote : q)),
        })),
      deleteQuote: (quoteNumber) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.quoteNumber !== quoteNumber),
          // Seed/demo quotes get re-added from SEED_QUOTES on every load (see merge
          // below), so a deletion of one of them has to be remembered separately —
          // otherwise it silently reappears after a refresh.
          deletedSeedQuoteNumbers: SEED_QUOTE_NUMBERS.has(quoteNumber)
            ? [...new Set([...state.deletedSeedQuoteNumbers, quoteNumber])]
            : state.deletedSeedQuoteNumbers,
        })),
      nextQuoteNumber: () => {
        const highest = get().quotes.reduce((max, q) => {
          const num = Number(q.quoteNumber.replace("Q-", ""));
          return Number.isFinite(num) && num > max ? num : max;
        }, 890000);
        return `Q-${highest + 1}`;
      },
    }),
    {
      name: "autonex-quotes-mock-store",
      // Seed/demo quotes always come from the current code, not from a browser's
      // stale localStorage snapshot — only quotes created via the wizard (i.e. not
      // one of the known seed quote numbers) are carried over from persisted state.
      // Seed quotes the user explicitly deleted stay deleted across reloads too.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<QuotesStore> | undefined;
        const persistedQuotes = persisted?.quotes ?? [];
        const deletedSeedQuoteNumbers = persisted?.deletedSeedQuoteNumbers ?? [];
        const deletedSeeds = new Set(deletedSeedQuoteNumbers);
        const userCreatedQuotes = persistedQuotes.filter((q) => !SEED_QUOTE_NUMBERS.has(q.quoteNumber));
        const survivingSeedQuotes = SEED_QUOTES.filter((q) => !deletedSeeds.has(q.quoteNumber));
        return {
          ...currentState,
          deletedSeedQuoteNumbers,
          quotes: [...userCreatedQuotes, ...survivingSeedQuotes],
        };
      },
    }
  )
);

export const QUOTE_STATUS_TONE: Record<QuoteStatus, "gray" | "info" | "success" | "secondary" | "outline" | "destructive"> = {
  Draft: "gray",
  Presented: "info",
  Accepted: "success",
  Rejected: "destructive",
  Closed: "secondary",
};

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  Master: "Master",
  WIL: "WIL",
  VIGIL: "VIGIL",
};
