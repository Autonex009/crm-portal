import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteInputWizard } from "../_components/quote-input-wizard";

export const metadata = { title: "New Quote — DealBridge" };

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <QuoteInputWizard />
    </Suspense>
  );
}
