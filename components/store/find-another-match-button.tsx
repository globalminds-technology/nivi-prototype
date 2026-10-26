"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface FindAnotherMatchButtonProps {
  label?: string;
  nextMatchUrl?: string;
  className?: string;
  variant?: "primary" | "secondary" | "footer";
  iconClassName?: string;
  matchIndex?: number;
  totalMatches?: number;
}

export function FindAnotherMatchButton({
  label = "Find Another Match",
  nextMatchUrl,
  className,
  variant = "primary",
  iconClassName,
  matchIndex,
  totalMatches,
}: FindAnotherMatchButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);

    if (nextMatchUrl) {
      // Instantly switch to the next matching saree recommendation without re-filling any form!
      router.push(nextMatchUrl);
    } else {
      window.location.assign("/quiz");
    }
  };

  const targetHref = nextMatchUrl || "/quiz";

  const defaultLabel =
    totalMatches && totalMatches > 1 && matchIndex !== undefined
      ? `Find Another Match (${matchIndex + 1}/${totalMatches})`
      : label;

  if (variant === "secondary") {
    return (
      <a
        href={targetHref}
        onClick={handleClick}
        className={
          className ||
          "inline-flex items-center gap-2 text-xs font-semibold text-[#073C35] hover:text-[#073C35]/80 transition-colors cursor-pointer select-none"
        }
        aria-label={label}
      >
        <RefreshCw
          className={`h-3.5 w-3.5 text-[#073C35] transition-transform ${
            isNavigating ? "animate-spin" : ""
          } ${iconClassName || ""}`}
        />
        <span>{isNavigating ? "Loading Next Match..." : label}</span>
      </a>
    );
  }

  if (variant === "footer") {
    return (
      <a
        href={targetHref}
        onClick={handleClick}
        className={
          className ||
          "inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-7 py-3 rounded-full bg-[#073C35] text-[#FAF7F0] hover:bg-[#073C35]/90 transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95 cursor-pointer select-none"
        }
        aria-label={label}
      >
        <RefreshCw
          className={`h-4 w-4 text-[#C9A45C] transition-transform ${
            isNavigating ? "animate-spin" : ""
          } ${iconClassName || ""}`}
        />
        <span>{isNavigating ? "Loading Match..." : label}</span>
      </a>
    );
  }

  // Primary Button: matches the exact dark green pill in user screenshot
  return (
    <a
      href={targetHref}
      onClick={handleClick}
      className={
        className ||
        "inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#073C35] hover:bg-[#073C35]/90 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 select-none"
      }
      aria-label={label}
    >
      <RefreshCw
        className={`h-3.5 w-3.5 text-[#C9A45C] transition-transform ${
          isNavigating ? "animate-spin" : ""
        } ${iconClassName || ""}`}
      />
      <span>{isNavigating ? "Loading Next Match..." : defaultLabel}</span>
    </a>
  );
}
