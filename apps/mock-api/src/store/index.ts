import {
  Profile,
  Company,
  Contact,
  Lead,
  Deal,
  Activity,
  Quote,
  QuoteVersion,
  Invoice,
  Payment,
  Product
} from "@crm/types";

// In-Memory Database Collections
export const profiles = new Map<string, Profile>();
export const companies = new Map<string, Company>();
export const contacts = new Map<string, Contact>();
export const leads = new Map<string, Lead>();
export const deals = new Map<string, Deal>();
export const activities = new Map<string, Activity>();
export const quotes = new Map<string, Quote>();
export const quoteVersions = new Map<string, QuoteVersion>();
export const invoices = new Map<string, Invoice>();
export const payments = new Map<string, Payment>();
export const products = new Map<string, Product>();

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Pagination helper
export function paginate<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(1, Number(params.page) || 1);
  const per_page = Math.max(1, Number(params.per_page) || 20);
  const total = items.length;
  const total_pages = Math.ceil(total / per_page);
  
  const start = (page - 1) * per_page;
  const end = start + per_page;
  const paginatedData = items.slice(start, end);

  return {
    success: true,
    data: paginatedData,
    meta: {
      page,
      per_page,
      total,
      total_pages,
    },
  };
}
