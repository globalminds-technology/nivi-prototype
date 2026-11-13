"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Review, ReviewSummary } from "@/core/domain/entities/review";

interface ProductReviewsProps {
  sku: string;
  productName: string;
  reviews: readonly Review[];
  summary: ReviewSummary;
}

export function ProductReviews({
  sku,
  productName,
  reviews,
  summary,
}: ProductReviewsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleReviews = useMemo(() => reviews.filter((r) => !r.hidden), [reviews]);
  const hasReviews = visibleReviews.length > 0;
  const displayedReviews = isExpanded ? visibleReviews : visibleReviews.slice(0, 2);
  const remainingCount = visibleReviews.length - 2;

  return (
    <div className="pt-12 sm:pt-16 border-t border-border/60">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Verified Patron Reviews
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Authentic feedback for {productName} from verified purchasers across India.
            </p>
          </div>

          {hasReviews && (
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(summary.average)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                      }`}
                  />
                ))}
              </div>
              <span className="font-serif font-bold text-lg text-foreground">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({summary.count} {summary.count === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {!hasReviews ? (
          <Card className="border-border/60 bg-muted/20 text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 fill-primary/30" />
            </div>
            <CardTitle className="font-serif text-lg font-medium mb-1">
              Be the First to Review
            </CardTitle>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Each creation from The Saree Studio is sent with a verified review invitation. Once you receive your saree, you can share your thoughts on its weave, drape, and texture.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left summary column */}
            <div className="md:col-span-4 bg-card p-5 rounded-lg border border-border/60 space-y-4">
              <div className="text-center pb-2 border-b border-border/50">
                <span className="font-serif text-4xl font-bold text-foreground">
                  {summary.average.toFixed(1)}
                </span>
                <div className="flex items-center justify-center gap-1 my-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(summary.average)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {summary.count} verified {summary.count === 1 ? "purchase" : "purchases"}
                </p>
              </div>

              {/* Star Distribution */}
              <div className="space-y-1.5 text-xs">
                {([5, 4, 3, 2, 1] as const).map((rating) => {
                  const count = summary.distribution[rating] || 0;
                  const percent = summary.count ? Math.round((count / summary.count) * 100) : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-12 font-mono text-muted-foreground flex items-center gap-1">
                        <span>{rating}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right reviews list */}
            <div className="md:col-span-8 space-y-4">
              {displayedReviews.map((r) => (
                <Card key={r.id} className="border-border/60 shadow-xs">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                              }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono gap-1 px-1.5 py-0"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {r.title && (
                      <h4 className="font-serif font-semibold text-sm text-foreground pt-1">
                        {r.title}
                      </h4>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {r.comment}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                      <span className="font-medium text-foreground">{r.authorName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {visibleReviews.length > 2 && (
                <div className="pt-2 text-center sm:text-left">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#073C35] bg-[#073C35]/6 hover:bg-[#073C35]/12 border border-[#073C35]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Show fewer reviews</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>+{remainingCount} more reviews</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
