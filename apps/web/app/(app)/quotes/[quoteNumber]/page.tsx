"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteWorkbench } from "../_components/quote-workbench";
import { useQuotesStore } from "../_components/quote-store";
import type { QuoteRecord } from "../_components/quote-module-data";

export default function QuoteDetailPage() {
  const params = useParams<{ quoteNumber: string }>();
  const quoteNumber = decodeURIComponent(params.quoteNumber);
  const quote = useQuotesStore((state) => state.quotes.find((q) => q.quoteNumber === quoteNumber));
  const updateQuote = useQuotesStore((state) => state.updateQuote);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleQuoteChange = useCallback(
    (nextQuote: QuoteRecord) => {
      updateQuote(quoteNumber, nextQuote);
    },
    [quoteNumber, updateQuote]
  );

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <Link href="/quotes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>
        <EmptyState
          icon={<FileQuestion className="h-8 w-8" />}
          title="Quote not found"
          description={`No quote matches ${quoteNumber}.`}
          action={
            <Link href="/quotes">
              <Button>Back to Quotes</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/quotes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Quotes
      </Link>
      <QuoteWorkbench initialQuote={quote} onQuoteChange={handleQuoteChange} />
    </div>
  );
}
