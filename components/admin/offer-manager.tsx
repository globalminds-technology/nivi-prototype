"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  Filter,
  Image as ImageIcon,
  Lock,
  Package,
  Percent,
  Plus,
  Power,
  Search,
  Sparkles,
  Square,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createOfferCampaignAction,
  updateOfferCampaignAction,
  setCampaignProductsAction,
  toggleCampaignStatusAction,
  deleteOfferCampaignAction,
  removeOfferFromProductAction,
  reorderBannersAction,
} from "@/app/actions/admin-offers";
import { uploadCampaignBannerAction } from "@/app/actions/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Category } from "@/core/domain/entities/category";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";

export interface AdminProductItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  primaryImageUrl?: string | null;
  offer?: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label: string;
    expiry?: string | null;
  } | null;
}

interface OfferManagerProps {
  campaigns: OfferCampaign[];
  products: AdminProductItem[];
  categories: Category[];
}

export function OfferManager({
  campaigns: initialCampaigns,
  products: initialProducts,
  categories,
}: OfferManagerProps) {
  const [campaignList, setCampaignList] = useState<OfferCampaign[]>(initialCampaigns);
  const [productList, setProductList] = useState<AdminProductItem[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  // Create/Edit Campaign Modal State
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState<"percent" | "flat">("percent");
  const [offerValue, setOfferValue] = useState("");
  const [offerLabel, setOfferLabel] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");

  // Banner states for Create/Edit Modal
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerCtaText, setBannerCtaText] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Manage Products Modal State
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [activeManagingCampaign, setActiveManagingCampaign] = useState<OfferCampaign | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Filter products for the Manage Products modal
  const filteredPickerProducts = useMemo(() => {
    return productList.filter((p) => {
      if (selectedCategoryFilter !== "all") {
        if ((p.category || "").toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        const matchCat = (p.category || "").toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchCat) return false;
      }
      return true;
    });
  }, [productList, searchQuery, selectedCategoryFilter]);

  // Exclusivity Map: tracks which product is enrolled in which active campaign
  const productActiveCampaignMap = useMemo(() => {
    const map = new Map<string, { campaignId: string; campaignName: string }>();
    for (const c of campaignList) {
      if (!c.active) continue;
      for (const pid of c.productIds) {
        if (!map.has(pid)) {
          map.set(pid, { campaignId: c.id, campaignName: c.name });
        }
      }
    }
    return map;
  }, [campaignList]);

  // Derived Stats
  const activeCampaigns = useMemo(() => {
    return campaignList.filter((c) => c.active);
  }, [campaignList]);

  // Ordered list of all campaigns
  const orderedCampaigns = useMemo(() => {
    return [...campaignList].sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      if (a.displayOrder !== undefined) return -1;
      if (b.displayOrder !== undefined) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [campaignList]);

  // Active campaigns that have a banner uploaded (displayed in hero carousel, max 5)
  const activeCarouselOffers = useMemo(() => {
    return orderedCampaigns.filter(
      (c) => c.active && Boolean(c.bannerImageUrl && c.bannerImageUrl.trim()),
    );
  }, [orderedCampaigns]);

  const activeOfferProducts = useMemo(() => {
    return productList.filter((p) => p.offer && p.offer.active);
  }, [productList]);

  const topDiscountText = useMemo(() => {
    if (activeCampaigns.length === 0) return "0%";
    const percentOffers = activeCampaigns.filter((c) => c.type === "percent");
    if (percentOffers.length > 0) {
      const maxPct = Math.max(...percentOffers.map((c) => c.value));
      return `${maxPct}%`;
    }
    const maxFlat = Math.max(...activeCampaigns.map((c) => c.value));
    return `₹${maxFlat}`;
  }, [activeCampaigns]);

  // Reorder Offers (Up/Down)
  const handleMoveOffer = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedCampaigns.length) return;
    const copy = [...orderedCampaigns];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const orderedIds = copy.map((c) => c.id);
    startTransition(async () => {
      const res = await reorderBannersAction(orderedIds);
      if (res.success) {
        setCampaignList(res.data.campaigns);
        toast.success("Offer display order updated!");
      } else {
        toast.error(res.error || "Failed to reorder offers.");
      }
    });
  };

  // Open Create Campaign Modal
  const openCreateDialog = () => {
    setEditingCampaignId(null);
    setName("");
    setOfferType("percent");
    setOfferValue("");
    setOfferLabel("");
    setOfferExpiry("");
    setBannerImageUrl("");
    setBannerTitle("");
    setBannerSubtitle("");
    setBannerCtaText("");
    setCampaignDialogOpen(true);
  };

  // Open Edit Campaign Modal
  const openEditDialog = (campaign: OfferCampaign) => {
    setEditingCampaignId(campaign.id);
    setName(campaign.name);
    setOfferType(campaign.type);
    setOfferValue(String(campaign.value));
    setOfferLabel(campaign.label);
    setOfferExpiry(campaign.expiry || "");
    setBannerImageUrl(campaign.bannerImageUrl || "");
    setBannerTitle(campaign.bannerTitle || "");
    setBannerSubtitle(campaign.bannerSubtitle || "");
    setBannerCtaText(campaign.bannerCtaText || "");
    setCampaignDialogOpen(true);
  };

  // Banner file upload handler (Cloudflare R2)
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("campaignId", editingCampaignId || "new_campaign");
      fd.append("file", file);

      const res = await uploadCampaignBannerAction(fd);
      if (res.success) {
        setBannerImageUrl(res.data.publicUrl);
        toast.success("Banner image successfully uploaded to R2!");
      } else {
        toast.error(res.error || "Failed uploading banner image.");
      }
    } catch {
      toast.error("An error occurred uploading the banner image.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Open Manage Products Modal for a specific campaign
  const openManageProductsDialog = (campaign: OfferCampaign) => {
    setActiveManagingCampaign(campaign);
    setSelectedProductIds([...campaign.productIds]);
    setSearchQuery("");
    setSelectedCategoryFilter("all");
    setManageDialogOpen(true);
  };

  // Save Create or Edit Campaign
  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a campaign name.");
      return;
    }

    const valNum = parseFloat(offerValue);
    if (isNaN(valNum) || valNum <= 0) {
      toast.error("Please enter a valid discount value greater than 0.");
      return;
    }

    const computedLabel =
      offerLabel.trim() || (offerType === "percent" ? `${valNum}% OFF` : `₹${valNum} OFF`);

    startTransition(async () => {
      if (editingCampaignId) {
        // Edit existing
        const res = await updateOfferCampaignAction({
          id: editingCampaignId,
          name: name.trim(),
          type: offerType,
          value: valNum,
          label: computedLabel,
          expiry: offerExpiry ? offerExpiry.trim() : null,
          bannerImageUrl: bannerImageUrl.trim() || null,
          bannerTitle: bannerTitle.trim() || null,
          bannerSubtitle: bannerSubtitle.trim() || null,
          bannerCtaText: bannerCtaText.trim() || null,
        });

        if (res.success) {
          setCampaignList((prev) =>
            prev.map((c) => (c.id === editingCampaignId ? res.data.campaign : c)),
          );
          setCampaignDialogOpen(false);
          toast.success("Offer campaign updated successfully!");
        } else {
          toast.error(res.error || "Failed to update offer campaign.");
        }
      } else {
        // Create new (can have 0 products!)
        const res = await createOfferCampaignAction({
          name: name.trim(),
          type: offerType,
          value: valNum,
          label: computedLabel,
          expiry: offerExpiry ? offerExpiry.trim() : null,
          productIds: [],
          bannerImageUrl: bannerImageUrl.trim() || null,
          bannerTitle: bannerTitle.trim() || null,
          bannerSubtitle: bannerSubtitle.trim() || null,
          bannerCtaText: bannerCtaText.trim() || null,
        });

        if (res.success) {
          setCampaignList((prev) => [res.data.campaign, ...prev]);
          setCampaignDialogOpen(false);
          toast.success("Offer campaign created! You can attach sarees to it anytime.");
        } else {
          toast.error(res.error || "Failed to create offer campaign.");
        }
      }
    });
  };

  // Save Products Attached to a Campaign
  const handleSaveProductsToCampaign = () => {
    if (!activeManagingCampaign) return;

    startTransition(async () => {
      const res = await setCampaignProductsAction(
        activeManagingCampaign.id,
        selectedProductIds,
      );

      if (res.success) {
        // Update campaign list
        setCampaignList((prev) =>
          prev.map((c) => (c.id === activeManagingCampaign.id ? res.data.campaign : c)),
        );

        // Update local product list state to reflect active offers
        setProductList((prev) =>
          prev.map((p) => {
            const isAttached = selectedProductIds.includes(p.id);
            if (isAttached) {
              return {
                ...p,
                offer: {
                  active: activeManagingCampaign.active,
                  type: activeManagingCampaign.type,
                  value: activeManagingCampaign.value,
                  label: activeManagingCampaign.label,
                  expiry: activeManagingCampaign.expiry,
                },
              };
            }
            if (activeManagingCampaign.productIds.includes(p.id)) {
              return { ...p, offer: null };
            }
            return p;
          }),
        );

        setManageDialogOpen(false);
        toast.success(
          `Updated offer! ${selectedProductIds.length} saree${
            selectedProductIds.length === 1 ? "" : "s"
          } attached.`,
        );
      } else {
        toast.error(res.error || "Failed to link sarees.");
      }
    });
  };

  // Toggle Campaign Active/Paused
  const handleToggleCampaign = (campaignId: string) => {
    startTransition(async () => {
      const res = await toggleCampaignStatusAction(campaignId);
      if (res.success) {
        setCampaignList((prev) =>
          prev.map((c) => (c.id === campaignId ? res.data.campaign : c)),
        );
        toast.success(
          res.data.campaign.active ? "Campaign is now Active!" : "Campaign is now Paused.",
        );
      } else {
        toast.error(res.error || "Failed to toggle status.");
      }
    });
  };

  // Delete Campaign
  const handleDeleteCampaign = (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this offer campaign?")) return;

    startTransition(async () => {
      const res = await deleteOfferCampaignAction(campaignId);
      if (res.success) {
        setCampaignList((prev) => prev.filter((c) => c.id !== campaignId));
        toast.success("Offer campaign deleted.");
      } else {
        toast.error(res.error || "Failed to delete campaign.");
      }
    });
  };

  // Quick Remove Product from Offer
  const handleRemoveProductFromOffer = (productId: string) => {
    startTransition(async () => {
      const res = await removeOfferFromProductAction(productId);
      if (res.success) {
        setProductList((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, offer: null } : p)),
        );
        setCampaignList((prev) =>
          prev.map((c) => ({
            ...c,
            productIds: c.productIds.filter((id) => id !== productId),
          })),
        );
        toast.success("Offer removed from saree.");
      } else {
        toast.error(res.error || "Failed to remove offer.");
      }
    });
  };

  const toggleProductSelect = (id: string) => {
    const other = productActiveCampaignMap.get(id);
    if (other && activeManagingCampaign && other.campaignId !== activeManagingCampaign.id) {
      toast.error(`This saree is already locked in active campaign "${other.campaignName}".`);
      return;
    }
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const availableFilteredIds = filteredPickerProducts
      .filter((p) => {
        const other = productActiveCampaignMap.get(p.id);
        return !other || (activeManagingCampaign && other.campaignId === activeManagingCampaign.id);
      })
      .map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...availableFilteredIds])));
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span>Special Offers & Promotions</span>
            <Badge variant="outline" className="font-mono text-xs text-primary border-brand/40">
              {activeCampaigns.length} Active
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create discount offers and attach sarees to them anytime.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2 shadow-xs">
          <Plus className="h-4 w-4" />
          <span>New Offer Campaign</span>
        </Button>
      </div>

      {/* Simplified Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Active Offers */}
        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Active Promotions</CardDescription>
            <CardTitle className="text-2xl font-bold font-serif text-foreground">
              {activeCampaigns.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              {activeCampaigns.length === 1
                ? "1 active offer running"
                : `${activeCampaigns.length} active offers running`}
            </p>
          </CardContent>
        </Card>

        {/* Stat 2: Total Sarees on Discount */}
        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Discounted Sarees</CardDescription>
            <CardTitle className="text-2xl font-bold font-serif text-foreground">
              {activeOfferProducts.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              {activeOfferProducts.length === 1
                ? "1 saree on discount"
                : `${activeOfferProducts.length} sarees on discount`}
            </p>
          </CardContent>
        </Card>

        {/* Stat 3: Highest Discount Value */}
        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Top Discount</CardDescription>
            <CardTitle className="text-2xl font-bold font-serif text-foreground">
              {topDiscountText}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Highest live discount</p>
          </CardContent>
        </Card>
      </div>

      {/* UNIFIED OFFERS TABLE */}
      <Card className="border-[#d2c8b5] bg-card shadow-[0_2px_12px_rgba(70,50,20,0.05)] overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border/50 bg-[#ede7d8]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <span>Offers</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage promotional offers and attached sarees. Active offers with banners automatically appear in the storefront hero carousel (maximum 5 active).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge
                variant="outline"
                className={`font-mono text-xs px-2.5 py-1 ${
                  activeCarouselOffers.length >= 5
                    ? "border-amber-500/60 text-amber-700 bg-amber-50"
                    : "border-primary/40 text-primary bg-primary/5"
                }`}
              >
                {activeCarouselOffers.length} / 5 in Hero Carousel
              </Badge>
              <Button
                onClick={openCreateDialog}
                size="sm"
                className="gap-1.5 text-xs shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Offer</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {orderedCampaigns.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-xl bg-muted/20">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No Offers Created Yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                Create your first promotional offer. You can attach sarees immediately and upload an optional banner to display it on the homepage hero carousel.
              </p>
              <Button onClick={openCreateDialog} size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Your First Offer</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orderedCampaigns.map((camp, idx) => {
                const attachedCount = camp.productIds.length;
                const hasBanner = Boolean(camp.bannerImageUrl && camp.bannerImageUrl.trim());

                return (
                  <div
                    key={camp.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                      camp.active
                        ? "border-border/70 bg-background/90 hover:bg-background hover:shadow-xs"
                        : "border-border/40 bg-muted/30 opacity-75"
                    }`}
                  >
                    {/* Left: Reorder position, Banner preview, and Offer info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Reorder Buttons & Position */}
                      <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0 || isPending}
                          onClick={() => handleMoveOffer(idx, "up")}
                          title="Move Up in Carousel"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <span className="font-mono text-[11px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                          #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === orderedCampaigns.length - 1 || isPending}
                          onClick={() => handleMoveOffer(idx, "down")}
                          title="Move Down in Carousel"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Banner Thumbnail */}
                      <div
                        className="relative h-14 w-28 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0 cursor-pointer group"
                        onClick={() => openEditDialog(camp)}
                        title="Click to edit banner"
                      >
                        {hasBanner ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={camp.bannerImageUrl!}
                            alt={camp.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px] gap-0.5 bg-muted/20">
                            <ImageIcon className="h-4 w-4" />
                            <span>No banner</span>
                          </div>
                        )}
                      </div>

                      {/* Offer Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-foreground truncate">
                            {camp.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0 font-mono font-semibold">
                            {camp.label || (camp.type === "percent" ? `${camp.value}% OFF` : `₹${camp.value} OFF`)}
                          </Badge>
                          <Badge
                            variant={camp.active ? "default" : "outline"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {camp.active ? "Active" : "Paused"}
                          </Badge>
                          {camp.active && hasBanner && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-700 bg-amber-50/60 font-sans">
                              In Carousel
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">
                            {attachedCount} saree{attachedCount === 1 ? "" : "s"} attached
                          </span>
                          <span>•</span>
                          <span>
                            Discount: {camp.type === "percent" ? `${camp.value}%` : `₹${camp.value} flat`}
                          </span>
                          {camp.expiry && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                Exp: {camp.expiry}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-border/40 w-full md:w-auto justify-end">
                      {/* Manage Sarees Button */}
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => openManageProductsDialog(camp)}
                        className="text-xs h-8 px-3 gap-1.5 shadow-2xs"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>Manage Sarees ({attachedCount})</span>
                      </Button>

                      {/* Edit Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(camp)}
                        className="text-xs h-8 px-2.5 gap-1"
                        title="Edit offer details & banner"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>

                      {/* Toggle Active / Pause */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleCampaign(camp.id)}
                        className={`h-8 w-8 ${
                          camp.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-primary hover:bg-primary/10"
                        }`}
                        title={camp.active ? "Pause offer" : "Activate offer"}
                        disabled={isPending}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Delete offer"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG 1: Create or Edit Offer Campaign */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveCampaign}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingCampaignId ? "Edit Offer Campaign" : "Create New Offer Campaign"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Set discount rules for this campaign. You can link sarees now or at any time later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel htmlFor="campaignName">Campaign Name *</FieldLabel>
                <Input
                  id="campaignName"
                  placeholder="e.g. Diwali Dhamaka, Pongal Special, Summer Clearance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isPending}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Discount Type</FieldLabel>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setOfferType("percent")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        offerType === "percent"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType("flat")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        offerType === "flat"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Flat (₹)
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dialogOfferValue">
                    Discount Value {offerType === "percent" ? "(%)" : "(₹)"} *
                  </FieldLabel>
                  <Input
                    id="dialogOfferValue"
                    type="number"
                    step="any"
                    min="1"
                    placeholder={offerType === "percent" ? "15" : "500"}
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    required
                    disabled={isPending}
                    className="font-mono text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="dialogOfferLabel">Badge Text (Optional)</FieldLabel>
                  <Input
                    id="dialogOfferLabel"
                    placeholder={offerType === "percent" ? "15% OFF" : "₹500 OFF"}
                    value={offerLabel}
                    onChange={(e) => setOfferLabel(e.target.value)}
                    disabled={isPending}
                  />
                  <FieldDescription className="text-[10px]">
                    Shown on product image cards
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dialogOfferExpiry">Expiry Date (Optional)</FieldLabel>
                  <Input
                    id="dialogOfferExpiry"
                    type="date"
                    value={offerExpiry}
                    onChange={(e) => setOfferExpiry(e.target.value)}
                    disabled={isPending}
                    className="text-xs"
                  />
                  <FieldDescription className="text-[10px]">
                    Discount ends on this date
                  </FieldDescription>
                </Field>
              </div>

              {/* Campaign Banner Settings */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span>Hero Carousel Banner (Optional)</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Upload a banner to display this campaign in the storefront hero carousel (max 5 active).
                    </p>
                  </div>
                  {bannerImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBannerImageUrl("")}
                      className="text-[11px] text-destructive hover:text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>

                {bannerImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black/5 aspect-[3/1] max-h-36 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerImageUrl}
                      alt="Campaign Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background text-foreground text-xs font-medium shadow-sm hover:bg-muted transition-colors">
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleBannerFileUpload}
                          disabled={isUploadingBanner || isPending}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                      {isUploadingBanner ? (
                        <Spinner className="h-6 w-6 text-primary my-2" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {isUploadingBanner ? "Uploading to Cloudflare R2..." : "Click to Upload Banner Image"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Recommended: 1920×600 px (JPEG, PNG, or WebP)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleBannerFileUpload}
                        disabled={isUploadingBanner || isPending}
                      />
                    </label>
                  </div>
                )}

                {/* Optional Custom Banner Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field>
                    <FieldLabel htmlFor="dialogBannerTitle" className="text-xs">Custom Headline (Optional)</FieldLabel>
                    <Input
                      id="dialogBannerTitle"
                      placeholder={name || "e.g. Royal Festive Collection"}
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      disabled={isPending}
                      className="text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="dialogBannerCtaText" className="text-xs">CTA Button Text (Optional)</FieldLabel>
                    <Input
                      id="dialogBannerCtaText"
                      placeholder="e.g. Explore Offers"
                      value={bannerCtaText}
                      onChange={(e) => setBannerCtaText(e.target.value)}
                      disabled={isPending}
                      className="text-xs"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">💡 Flexible Saree Linking: </span>
                You don&apos;t need products right now. Once created, you can link or unlink sarees
                to this offer whenever you like using the &quot;Manage Sarees&quot; button.
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCampaignDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 shadow-xs">
                {isPending && <Spinner className="h-3.5 w-3.5" />}
                <span>{editingCampaignId ? "Save Changes" : "Create Offer"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Manage Sarees for Campaign */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span>Manage Sarees for &ldquo;{activeManagingCampaign?.name}&rdquo;</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Check the sarees that should receive this {activeManagingCampaign?.label} discount.
              Uncheck to remove.
            </DialogDescription>
          </DialogHeader>

          {/* Product Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 py-2 border-b border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by saree name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug || c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllFiltered}
                className="h-8 text-[11px] px-2.5"
                disabled={filteredPickerProducts.length === 0}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-8 text-[11px] px-2"
                disabled={selectedProductIds.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-border/40 py-1">
            {productList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Package className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No Sarees in Catalog Yet</p>
                <p className="text-xs max-w-sm mx-auto">
                  Once you create your first saree under &quot;Add Product&quot;, it will show up
                  here so you can attach it to this offer anytime!
                </p>
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted mt-3"
                >
                  Add Product Now
                </Link>
              </div>
            ) : filteredPickerProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No sarees match your current search or category filter.
              </div>
            ) : (
              filteredPickerProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const otherCampaign = productActiveCampaignMap.get(p.id);
                const isLocked = Boolean(
                  otherCampaign &&
                    activeManagingCampaign &&
                    otherCampaign.campaignId !== activeManagingCampaign.id,
                );

                // Discount preview calculation
                let discountedPrice = p.price;
                if (activeManagingCampaign) {
                  const val = activeManagingCampaign.value;
                  const discountAmt =
                    activeManagingCampaign.type === "percent"
                      ? Math.round((p.price * val) / 100)
                      : Math.min(p.price, val);
                  discountedPrice = Math.max(0, p.price - discountAmt);
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isLocked) toggleProductSelect(p.id);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isLocked
                        ? "opacity-60 bg-muted/20 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                        : "hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary shrink-0">
                        {isLocked ? (
                          <Lock className="h-4 w-4 text-muted-foreground/60" />
                        ) : isSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>

                      <div className="relative h-11 w-9 rounded border border-border overflow-hidden bg-muted/30 shrink-0">
                        {p.primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.primaryImageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                            <Package className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-foreground line-clamp-1">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {p.sku} {p.category ? `• ${p.category}` : ""}
                          </span>
                          {isLocked && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 font-normal border-amber-500/50 text-amber-700 bg-amber-50"
                            >
                              Locked in &ldquo;{otherCampaign?.campaignName}&rdquo;
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      {isSelected ? (
                        <div>
                          <div className="font-mono font-bold text-xs text-primary">
                            ₹{discountedPrice.toLocaleString("en-IN")}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground line-through">
                            ₹{p.price.toLocaleString("en-IN")}
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-xs text-foreground">
                          ₹{p.price.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border/50 flex items-center justify-between sm:justify-between w-full">
            <span className="text-xs font-mono text-muted-foreground">
              {selectedProductIds.length} saree{selectedProductIds.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManageDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending || productList.length === 0}
                onClick={handleSaveProductsToCampaign}
                className="gap-1.5 shadow-xs"
              >
                {isPending && <Spinner className="h-3.5 w-3.5" />}
                <span>Save Sarees ({selectedProductIds.length})</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
