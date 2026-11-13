import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/era-logo.PNG"
      alt="ERA — Culture · Activities · Experiences"
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}