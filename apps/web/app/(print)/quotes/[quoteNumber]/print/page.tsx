"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QuotePrintPreview } from "@/app/(app)/quotes/_components/quote-print-preview";
import { useQuotesStore } from "@/app/(app)/quotes/_components/quote-store";

export default function QuotePrintPage() {
  const params = useParams<{ quoteNumber: string }>();
  const quoteNumber = decodeURIComponent(params.quoteNumber);
  const quote = useQuotesStore((state) => state.quotes.find((q) => q.quoteNumber === quoteNumber));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[210mm] space-y-4 p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-10">
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

  return <QuotePrintPreview quote={quote} />;
}
