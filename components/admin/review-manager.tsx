"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleReviewVisibilityAction } from "@/app/actions/reviews";

export interface SerializedReviewItem {
  id: string;
  sku: string;
  invoiceId: string;
  rating: number;
  title: string | null;
  comment: string;
  authorName: string;
  createdAt: string;
  hidden?: boolean;
}

export interface ReviewProductInfo {
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface ReviewManagerProps {
  initialReviews: SerializedReviewItem[];
  productsMap: Record<string, ReviewProductInfo>;
}

export function ReviewManager({ initialReviews, productsMap }: ReviewManagerProps) {
  const [reviews, setReviews] = useState<SerializedReviewItem[]>(initialReviews);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const pageSize = 10;

  // Overview stats
  const totalCount = reviews.length;
  const hiddenCount = reviews.filter((r) => r.hidden).length;
  const visibleCount = totalCount - hiddenCount;
  const averageRating = useMemo(() => {
    const visible = reviews.filter((r) => !r.hidden);
    if (visible.length === 0) return 0;
    const sum = visible.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / visible.length) * 10) / 10;
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Status Filter
      if (statusFilter === "visible" && r.hidden) return false;
      if (statusFilter === "hidden" && !r.hidden) return false;

      // 2. Rating Filter
      if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter, 10)) {
        return false;
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const pInfo = productsMap[r.sku.toLowerCase()];
        const matchesSku = r.sku.toLowerCase().includes(q);
        const matchesAuthor = r.authorName.toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        const matchesTitle = (r.title || "").toLowerCase().includes(q);
        const matchesProduct = (pInfo?.name || "").toLowerCase().includes(q);

        return matchesSku || matchesAuthor || matchesComment || matchesTitle || matchesProduct;
      }

      return true;
    });
  }, [reviews, statusFilter, ratingFilter, search, productsMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + pageSize);

  const handleToggle = (review: SerializedReviewItem) => {
    const nextHidden = !review.hidden;

    // Optimistic UI update
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, hidden: nextHidden } : r)),
    );

    startTransition(async () => {
      const res = await toggleReviewVisibilityAction(review.id, review.sku, nextHidden);
      if (res.success) {
        toast.success(
          nextHidden
            ? `Review hidden from storefront`
            : `Review made visible on storefront`,
        );
      } else {
        // Rollback on failure
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, hidden: review.hidden } : r)),
        );
        toast.error(res.error || "Failed to update review visibility");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#30251F]">
            Customer Reviews & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-[#786960] mt-1">
            All reviews are stored in Cloudflare R2 and visible by default. You can hide inappropriate or unverified reviews from the storefront at any time.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-[#D5CCBB]/80 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#786960]">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-[#073C35]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#30251F]">{totalCount}</div>
            <p className="text-[11px] text-[#786960] mt-0.5">Across all catalog sarees</p>
          </CardContent>
        </Card>

        <Card className="border border-[#D5CCBB]/80 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-emerald-800">Publicly Visible</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700">{visibleCount}</div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Live on customer product pages</p>
          </CardContent>
        </Card>

        <Card className="border border-[#D5CCBB]/80 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-amber-800">Hidden Reviews</CardTitle>
            <EyeOff className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700">{hiddenCount}</div>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Hidden by store admin</p>
          </CardContent>
        </Card>

        <Card className="border border-[#D5CCBB]/80 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#786960]">Average Rating</CardTitle>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#30251F]">
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </div>
            <p className="text-[11px] text-[#786960] mt-0.5">Calculated from visible reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-[#D5CCBB]/80 bg-[#FFFCF7] p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#786960]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, comment, or SKU..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#D5CCBB] rounded-xl text-[#30251F] placeholder:text-[#786960]/60 focus:outline-none focus:ring-2 focus:ring-[#073C35]/20 focus:border-[#073C35]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="inline-flex rounded-xl bg-white border border-[#D5CCBB] p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "all"
                    ? "bg-[#073C35] text-white font-semibold"
                    : "text-[#786960] hover:text-[#073C35]"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("visible");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "visible"
                    ? "bg-emerald-700 text-white font-semibold"
                    : "text-[#786960] hover:text-emerald-700"
                }`}
              >
                Visible ({visibleCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("hidden");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "hidden"
                    ? "bg-amber-700 text-white font-semibold"
                    : "text-[#786960] hover:text-amber-700"
                }`}
              >
                Hidden ({hiddenCount})
              </button>
            </div>

            {/* Rating Filter Dropdown */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-[#D5CCBB] text-[#30251F] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#073C35]/20 font-medium"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {paginatedReviews.length === 0 ? (
        <Card className="border border-[#D5CCBB]/80 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#073C35]/10 text-[#073C35] flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 opacity-60" />
          </div>
          <p className="font-serif text-base font-semibold text-[#30251F]">No reviews match your filters</p>
          <p className="text-xs text-[#786960] mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "all" || ratingFilter !== "all"
              ? "Try adjusting your search terms or filter selection."
              : "When customers complete a purchase and submit feedback via their review invitation link, reviews will show here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedReviews.map((r) => {
            const product = productsMap[r.sku.toLowerCase()];
            const isHidden = Boolean(r.hidden);

            return (
              <Card
                key={r.id}
                className={`border transition-all bg-white shadow-2xs ${
                  isHidden
                    ? "border-amber-300/80 bg-amber-50/20"
                    : "border-[#D5CCBB]/80 hover:border-[#073C35]/40"
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Product & Review details */}
                    <div className="flex gap-3 sm:gap-4 items-start min-w-0 flex-1">
                      {/* Product Thumbnail */}
                      <div className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-[#FAF4EA] overflow-hidden shrink-0 border border-[#D5CCBB]">
                        {product?.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#B0A292]">
                            <Package className="w-5 h-5 text-[#7AA79D]" />
                          </div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Product Name & SKU Link */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {product?.slug ? (
                            <Link
                              href={`/products/${product.slug}`}
                              target="_blank"
                              className="font-medium text-xs sm:text-sm text-[#073C35] hover:underline"
                            >
                              {product.name}
                            </Link>
                          ) : (
                            <span className="font-medium text-xs sm:text-sm text-[#30251F]">{product?.name || r.sku}</span>
                          )}
                          <span className="text-[10px] font-mono text-[#786960] bg-[#073C35]/6 px-1.5 py-0.5 rounded">
                            SKU: {r.sku}
                          </span>
                        </div>

                        {/* Rating Stars + Customer Details */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-[#30251F]">{r.authorName}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                          <span className="text-[11px] text-[#786960]">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Review Title */}
                        {r.title && (
                          <p className="font-serif font-semibold text-xs sm:text-sm text-[#30251F] pt-0.5">
                            {r.title}
                          </p>
                        )}

                        {/* Review Comment */}
                        <p className="text-xs text-[#5C4D3C] leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-2.5 rounded-xl border border-[#D5CCBB]/50">
                          {r.comment}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status badge & Toggle Button */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D5CCBB]/40">
                      {/* Status Badge */}
                      {isHidden ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-300 font-medium inline-flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3 text-amber-600" />
                          <span>Hidden from Store</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-300 font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Visible on Store</span>
                        </Badge>
                      )}

                      {/* Action Toggle Button */}
                      <Button
                        type="button"
                        size="sm"
                        variant={isHidden ? "default" : "outline"}
                        disabled={isPending}
                        onClick={() => handleToggle(r)}
                        className={`text-xs h-8 px-3 rounded-xl gap-1.5 font-medium transition-all cursor-pointer ${
                          isHidden
                            ? "bg-[#073C35] hover:bg-[#073C35]/90 text-white"
                            : "text-amber-800 border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Make Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Review</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 px-1 text-xs text-[#786960]">
              <div>
                Showing <span className="font-semibold text-[#30251F]">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-[#30251F]">
                  {Math.min(startIndex + pageSize, filteredReviews.length)}
                </span>{" "}
                of <span className="font-semibold text-[#30251F]">{filteredReviews.length}</span> reviews
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 rounded-lg border-[#D5CCBB] text-[#30251F]"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Prev</span>
                </Button>

                <span className="px-2 font-mono font-medium text-[#30251F]">
                  {safeCurrentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 rounded-lg border-[#D5CCBB] text-[#30251F]"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

