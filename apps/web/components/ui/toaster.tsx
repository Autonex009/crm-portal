"use client";

import { useToast } from "./use-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2 bg-background",
            t.variant === "destructive" && "border-destructive/30 bg-destructive/5",
            t.variant === "success" && "border-emerald-500/30 bg-emerald-50"
          )}
        >
          {t.variant === "destructive" && <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
          {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
          {(!t.variant || t.variant === "default") && <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
