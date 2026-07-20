import { createDefaultTemplateValues, type QuoteCategoryTemplateValues } from "./quote-template-schemas";

export const QUOTE_STATUS_STEPS = ["Draft", "Presented", "Accepted", "Closed"] as const;

export type QuoteStatus = (typeof QUOTE_STATUS_STEPS)[number] | "Rejected";

export const PRODUCT_CATEGORIES = ["Master", "WIL", "VIGIL"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface QuoteLookupRef {
  id: string;
  label: string;
  href: string;
}

export interface QuoteRecord {
  quoteNumber: string;
  quoteName: string;
  opportunity: QuoteLookupRef;
  account: QuoteLookupRef;
  expirationDate: string;
  status: QuoteStatus;
  productCategory: ProductCategory;
  createdBy: {
    name: string;
    role: string;
    email: string;
    createdAt: string;
  };
  categoryTemplate: QuoteCategoryTemplateValues;
}

export const mockQuoteRecord: QuoteRecord = {
  quoteNumber: "Q-890243",
  quoteName: "FY27 Expansion Proposal",
  opportunity: {
    id: "opp-enterprise-renewal",
    label: "Autonex Enterprise Renewal",
    href: "/deals",
  },
  account: {
    id: "acct-autonex",
    label: "Autonex Manufacturing Group",
    href: "/companies",
  },
  expirationDate: "2026-08-15",
  status: "Presented",
  productCategory: "Master",
  createdBy: {
    name: "Mustafa Ujjainwala",
    role: "Senior Account Executive",
    email: "mustafa.ujjainwala@autonex.local",
    createdAt: "2026-07-12T10:30:00.000Z",
  },
  categoryTemplate: createDefaultTemplateValues("Master"),
};
