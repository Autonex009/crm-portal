import { cn } from "@/lib/utils";

export function QuoteBrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/autonex-logo.png"
      alt="Autonex"
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}

export function QuoteMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/autonex-mark.png"
      alt=""
      aria-hidden="true"
      className={cn("h-6 w-6 object-contain", className)}
    />
  );
}
