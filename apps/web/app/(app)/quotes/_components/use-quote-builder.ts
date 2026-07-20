"use client";

import { useMemo, useState } from "react";
import { mockQuoteRecord, QUOTE_STATUS_STEPS, type QuoteRecord, type QuoteStatus } from "./quote-module-data";
import { CATEGORY_TEMPLATE_SCHEMAS, resolveCostLines, roundCurrency } from "./quote-template-schemas";

const TAX_RATE = 0.085;

export function formatQuoteCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getStatusStepIndex(status: QuoteStatus) {
  return (QUOTE_STATUS_STEPS as readonly string[]).indexOf(status);
}

export function useQuoteBuilder(initialQuote: QuoteRecord = mockQuoteRecord) {
  const [quote, setQuote] = useState<QuoteRecord>(initialQuote);

  const isLocked = quote.status === "Closed";
  const schema = CATEGORY_TEMPLATE_SCHEMAS[quote.productCategory];

  const costLines = useMemo(
    () => resolveCostLines(schema, quote.categoryTemplate),
    [schema, quote.categoryTemplate]
  );

  const financialSummary = useMemo(() => {
    const subtotal = roundCurrency(costLines.reduce((sum, line) => sum + line.total, 0));
    const taxAmount = roundCurrency(subtotal * TAX_RATE);
    const grandTotal = roundCurrency(subtotal + taxAmount);

    return { subtotal, taxAmount, grandTotal };
  }, [costLines]);

  function updateStatus(status: QuoteStatus) {
    setQuote((current) => ({ ...current, status }));
  }

  function convertToInvoice() {
    setQuote((current) => ({ ...current, status: "Closed" }));
  }

  return {
    quote,
    schema,
    costLines,
    financialSummary,
    isLocked,
    updateStatus,
    convertToInvoice,
  };
}
