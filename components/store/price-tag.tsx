import { Badge } from "@/components/ui/badge";

interface PriceTagProps {
  priceMinor: number;
  offer?: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label?: string;
  } | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PriceTag({ priceMinor, offer, size = "default", className = "" }: PriceTagProps) {
  const originalPrice = priceMinor / 100;

  let effectivePrice = originalPrice;
  let savingsLabel = "";

  if (offer?.active) {
    if (offer.type === "percent") {
      const discount = (originalPrice * offer.value) / 100;
      effectivePrice = Math.max(0, originalPrice - discount);
      savingsLabel = `${offer.value}% OFF`;
    } else {
      effectivePrice = Math.max(0, originalPrice - offer.value);
      savingsLabel = `₹${offer.value.toLocaleString("en-IN")} OFF`;
    }
  }

  const formatInr = (val: number) =>
    `₹${Math.round(val).toLocaleString("en-IN")}`;

  const textClasses = {
    sm: "text-xs font-semibold sm:text-sm",
    default: "text-base font-semibold",
    lg: "text-2xl font-bold font-serif",
  }[size];

  return (
    <div className={`flex items-baseline gap-1 sm:gap-1.5 flex-wrap ${className}`}>
      <span className={`font-mono text-foreground tracking-tight ${textClasses}`}>
        {formatInr(effectivePrice)}
      </span>

      {offer?.active && effectivePrice < originalPrice && (
        <>
          <span className="font-mono text-[10px] sm:text-xs line-through text-muted-foreground/80">
            {formatInr(originalPrice)}
          </span>
          <Badge
            variant="secondary"
            className="text-[8px] sm:text-[9px] px-1 py-0 font-semibold tracking-wide bg-primary/10 text-primary border-primary/20"
          >
            {offer.label || savingsLabel}
          </Badge>
        </>
      )}
    </div>
  );
}
