"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitReviewAction } from "@/app/actions/reviews";

interface ReviewFormProps {
  token: string;
  sku: string;
  invoiceId: string;
  productName?: string;
}

export function ReviewForm({ token, sku, invoiceId, productName }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!authorName.trim() || authorName.trim().length < 2) {
      errs.authorName = "Please enter your name (min 2 characters)";
    }
    if (!comment.trim() || comment.trim().length < 10) {
      errs.comment = "Please write at least 10 characters describing the fabric, drape or weave";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const res = await submitReviewAction({
        token,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        title: title.trim() || null,
        comment: comment.trim(),
        authorName: authorName.trim(),
      });

      if (res.success) {
        setIsSubmitted(true);
        toast.success("Thank you! Your verified review has been published.");
      } else {
        toast.error(res.error || "Failed to submit review");
      }
    });
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto text-center border-border/70 shadow-sm p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <CardTitle className="font-serif text-2xl font-medium mb-2">
          Review Published
        </CardTitle>
        <CardDescription className="text-sm mb-6">
          Your feedback has been verified and added to the product page. Thank you for supporting our artisans!
        </CardDescription>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className={buttonVariants({
              variant: "default",
              className: "w-full",
            })}
          >
            <span>Return to Store</span>
          </Link>
        </div>
      </Card>
    );
  }

  const activeStarCount = hoverRating ?? rating;

  return (
    <Card className="max-w-lg mx-auto border-border/70 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] gap-1 px-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Purchase</span>
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">SKU: {sku}</span>
          <span className="text-[11px] font-mono text-muted-foreground/70 hidden sm:inline">• Inv #{invoiceId}</span>
        </div>
        <CardTitle className="font-serif text-2xl font-semibold">
          {productName ? `Review ${productName}` : "Share Your Experience"}
        </CardTitle>
        <CardDescription className="text-xs">
          Your review will help future patrons understand the drape, texture, and authenticity of this handwoven creation.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Your Rating *</Label>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 rounded-sm transition-transform hover:scale-110 focus:outline-hidden cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeStarCount
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-medium ml-2 text-muted-foreground">
                {activeStarCount === 5
                  ? "5 / 5 (Exceptional)"
                  : activeStarCount === 4
                  ? "4 / 5 (Very Good)"
                  : activeStarCount === 3
                  ? "3 / 5 (Average)"
                  : activeStarCount === 2
                  ? "2 / 5 (Needs Improvement)"
                  : "1 / 5 (Poor)"}
              </span>
            </div>
          </div>

          {/* Author Name */}
          <div className="space-y-1.5">
            <Label htmlFor="review-author" className="text-xs font-medium">
              Your Name *
            </Label>
            <Input
              id="review-author"
              placeholder="e.g. Radhika Narayanan"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={errors.authorName ? "border-destructive" : ""}
            />
            {errors.authorName && (
              <p className="text-[11px] text-destructive">{errors.authorName}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="review-title" className="text-xs font-medium">
              Headline (Optional)
            </Label>
            <Input
              id="review-title"
              placeholder="e.g. Magnificent Zari and Breathable Silk!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Detailed comment */}
          <div className="space-y-1.5">
            <Label htmlFor="review-comment" className="text-xs font-medium">
              Your Feedback *
            </Label>
            <Textarea
              id="review-comment"
              placeholder="Describe the fabric quality, color richness, packaging, and drape..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={errors.comment ? "border-destructive" : ""}
            />
            {errors.comment && (
              <p className="text-[11px] text-destructive">{errors.comment}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Minimum 10 characters. Please be honest and specific.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-sm font-semibold tracking-wide cursor-pointer"
            >
              {isPending ? "Publishing Review..." : "Submit Verified Review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
