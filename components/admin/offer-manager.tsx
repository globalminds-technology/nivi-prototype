"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  GripVertical,
  Image as ImageIcon,
  Kanban,
  LayoutList,
  Lock,
  Move,
  Package,
  Percent,
  Plus,
  Power,
  RotateCcw,
  Search,
  Sliders,
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
import {
  updateHeroBannerAction,
  uploadHeroBannerAction,
  resetHeroBannerAction,
  reorderAllCarouselSlidesAction,
} from "@/app/actions/admin-hero-banner";
import { uploadCampaignBannerAction } from "@/app/actions/media";
import { ImageCropperModal } from "@/components/admin/image-cropper-modal";
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
import {
  DEFAULT_HERO_BANNER,
  type HeroBannerConfig,
} from "@/core/domain/entities/hero-banner";
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
  initialHeroBanner?: HeroBannerConfig | null;
}

export function OfferManager({
  campaigns: initialCampaigns,
  products: initialProducts,
  categories,
  initialHeroBanner,
}: OfferManagerProps) {
  const [campaignList, setCampaignList] = useState<OfferCampaign[]>(initialCampaigns);
  const [productList, setProductList] = useState<AdminProductItem[]>(initialProducts);
  const [heroBanner, setHeroBanner] = useState<HeroBannerConfig>(
    initialHeroBanner || DEFAULT_HERO_BANNER,
  );
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"banners" | "offers">("banners");
  const [carouselViewMode, setCarouselViewMode] = useState<"kanban" | "list">("kanban");
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  // Initial Hero Banner Dialog State
  const [heroDialogOpen, setHeroDialogOpen] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(heroBanner.imageUrl);
  const [heroTagline, setHeroTagline] = useState(heroBanner.tagline || "");
  const [heroTitle, setHeroTitle] = useState(heroBanner.title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(heroBanner.subtitle || "");
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState(heroBanner.primaryCtaText || "");
  const [heroPrimaryCtaLink, setHeroPrimaryCtaLink] = useState(heroBanner.primaryCtaLink || "");
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState(heroBanner.secondaryCtaText || "");
  const [heroSecondaryCtaLink, setHeroSecondaryCtaLink] = useState(heroBanner.secondaryCtaLink || "");
  const [heroShowOverlay, setHeroShowOverlay] = useState(heroBanner.showOverlay !== false);
  const [heroTextPosition, setHeroTextPosition] = useState<"left" | "center" | "right">(
    heroBanner.textPosition || "left",
  );
  const [heroPositionX, setHeroPositionX] = useState<number>(heroBanner.imagePositionX ?? 85);
  const [heroPositionY, setHeroPositionY] = useState<number>(heroBanner.imagePositionY ?? 15);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Dedicated 3:1 Banner Cropper Modal state
  const [cropperModalState, setCropperModalState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    targetType: "hero" | "campaign";
  } | null>(null);

  // Create/Edit Campaign Modal State
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState<"percent" | "flat">("percent");
  const [offerValue, setOfferValue] = useState("");
  const [offerLabel, setOfferLabel] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");

  // Banner states for Campaign Modal
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerCtaText, setBannerCtaText] = useState("");
  const [bannerPositionX, setBannerPositionX] = useState<number>(50);
  const [bannerPositionY, setBannerPositionY] = useState<number>(50);
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

  // Active campaigns that have a banner uploaded
  const activeCarouselOffers = useMemo(() => {
    return orderedCampaigns.filter(
      (c) => c.active && Boolean(c.bannerImageUrl && c.bannerImageUrl.trim()),
    );
  }, [orderedCampaigns]);

  // Unified list of all carousel slides (Hero Banner + Offer Banners) for reordering
  type UnifiedSlideItem =
    | {
        id: string;
        type: "hero";
        title: string;
        subtitle: string;
        imageUrl: string;
        order: number;
        active: boolean;
        badge: string;
      }
    | {
        id: string;
        type: "campaign";
        title: string;
        subtitle: string;
        imageUrl: string;
        order: number;
        active: boolean;
        badge: string;
        campaign: OfferCampaign;
      };

  const carouselSlides = useMemo<UnifiedSlideItem[]>(() => {
    const items: UnifiedSlideItem[] = [];

    // Hero banner slide
    items.push({
      id: "hero_main",
      type: "hero",
      title: heroBanner.title || "Flagship Brand Banner",
      subtitle: heroBanner.tagline || "Initial Home Hero Slide",
      imageUrl: heroBanner.imageUrl || "/nivi-hero-banner-v2.jpg",
      order: heroBanner.displayOrder ?? 0,
      active: heroBanner.active !== false,
      badge: "Initial Flagship",
    });

    // Offer campaigns with banners
    orderedCampaigns.forEach((c, idx) => {
      if (c.bannerImageUrl && c.bannerImageUrl.trim()) {
        items.push({
          id: c.id,
          type: "campaign",
          title: c.name,
          subtitle: c.label || `${c.value}% OFF`,
          imageUrl: c.bannerImageUrl,
          order: c.displayOrder ?? idx + 1,
          active: c.active,
          badge: c.active ? "In Carousel" : "Paused",
          campaign: c,
        });
      }
    });

    return items.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.id.localeCompare(b.id);
    });
  }, [heroBanner, orderedCampaigns]);

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

  // Reorder Unified Carousel Slides (Initial Hero & Offer Banners)
  const handleMoveCarouselSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= carouselSlides.length) return;

    console.log(
      `[Kanban:MoveButton] Moving slide from #${index + 1} to #${targetIndex + 1} (${direction})`,
      carouselSlides[index],
    );

    const copy = [...carouselSlides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const orderedItems = copy.map((item) => ({
      id: item.id,
      type: item.type,
    }));

    console.log(
      "[Kanban:MoveButton] New sequence:",
      orderedItems.map((item, i) => `#${i + 1}: ${item.id} (${item.type})`),
    );

    // Optimistic immediate update to local state
    const heroIdx = orderedItems.findIndex((it) => it.type === "hero");
    if (heroIdx !== -1) {
      setHeroBanner((prev) => ({ ...prev, displayOrder: heroIdx }));
    }
    setCampaignList((prev) =>
      prev.map((c) => {
        const campIdx = orderedItems.findIndex((it) => it.id === c.id);
        return campIdx !== -1 ? { ...c, displayOrder: campIdx } : c;
      }),
    );

    startTransition(async () => {
      const res = await reorderAllCarouselSlidesAction(orderedItems);
      console.log("[Kanban:MoveButton] Server response:", res);
      if (res.success) {
        setHeroBanner(res.data.heroBanner);
        setCampaignList(res.data.campaigns);
        toast.success(`Slide moved to position #${targetIndex + 1}!`);
      } else {
        toast.error(res.error || "Failed to reorder carousel slides.");
      }
    });
  };

  // Drag and Drop reordering for Kanban and List views
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    console.log(
      `[Kanban:DragStart] Started dragging slide #${index + 1} (${carouselSlides[index]?.id}: "${carouselSlides[index]?.title}")`,
    );
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSlideIndex !== index) {
      setDragOverSlideIndex(index);
      console.log(`[Kanban:DragOver] Hovering over position #${index + 1}`);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const dataText = e.dataTransfer.getData("text/plain");
    const parsedIndex = dataText ? parseInt(dataText, 10) : null;
    const sourceIndex = dragItemRef.current !== null ? dragItemRef.current : parsedIndex;

    console.log(
      `[Kanban:Drop] Drop event triggered! sourceIndex=${sourceIndex}, targetIndex=${targetIndex}`,
    );

    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
    dragItemRef.current = null;

    if (sourceIndex === null || isNaN(sourceIndex) || sourceIndex === targetIndex) {
      console.log("[Kanban:Drop] No position change needed (source equals target or invalid)");
      return;
    }

    const copy = [...carouselSlides];
    const [moved] = copy.splice(sourceIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const orderedItems = copy.map((item) => ({
      id: item.id,
      type: item.type,
    }));

    console.log(
      "[Kanban:Drop] New slide order sequence:",
      orderedItems.map((item, i) => `#${i + 1}: ${item.id} (${item.type})`),
    );

    // Optimistic immediate update to local state so UI updates in 0ms
    const heroIdx = orderedItems.findIndex((it) => it.type === "hero");
    if (heroIdx !== -1) {
      setHeroBanner((prev) => ({ ...prev, displayOrder: heroIdx }));
    }
    setCampaignList((prev) =>
      prev.map((c) => {
        const campIdx = orderedItems.findIndex((it) => it.id === c.id);
        return campIdx !== -1 ? { ...c, displayOrder: campIdx } : c;
      }),
    );

    startTransition(async () => {
      console.log("[Kanban:Drop] Calling reorderAllCarouselSlidesAction with:", orderedItems);
      const res = await reorderAllCarouselSlidesAction(orderedItems);
      console.log("[Kanban:Drop] reorderAllCarouselSlidesAction result:", res);

      if (res.success) {
        setHeroBanner(res.data.heroBanner);
        setCampaignList(res.data.campaigns);
        toast.success(`Slide moved to position #${targetIndex + 1}!`);
      } else {
        toast.error(res.error || "Failed to reorder carousel slides.");
      }
    });
  };

  const handleDragEnd = () => {
    console.log("[Kanban:DragEnd] Drag operation ended");
    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
    dragItemRef.current = null;
  };

  // Open Hero Banner Edit Modal
  const openHeroDialog = () => {
    setHeroImageUrl(heroBanner.imageUrl || "/nivi-hero-banner-v2.jpg");
    setHeroTagline(heroBanner.tagline || "");
    setHeroTitle(heroBanner.title || "");
    setHeroSubtitle(heroBanner.subtitle || "");
    setHeroPrimaryCtaText(heroBanner.primaryCtaText || "");
    setHeroPrimaryCtaLink(heroBanner.primaryCtaLink || "");
    setHeroSecondaryCtaText(heroBanner.secondaryCtaText || "");
    setHeroSecondaryCtaLink(heroBanner.secondaryCtaLink || "");
    setHeroShowOverlay(heroBanner.showOverlay !== false);
    setHeroTextPosition(heroBanner.textPosition || "left");
    setHeroPositionX(heroBanner.imagePositionX ?? 85);
    setHeroPositionY(heroBanner.imagePositionY ?? 15);
    setHeroDialogOpen(true);
  };

  const uploadHeroFileDirectly = async (file: File) => {
    setIsUploadingHero(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await uploadHeroBannerAction(fd);
      if (res.success) {
        setHeroImageUrl(res.data.publicUrl);
        toast.success("Hero banner uploaded to Cloudflare R2!");
      } else {
        toast.error(res.error || "Failed uploading hero banner.");
      }
    } catch {
      toast.error("An error occurred uploading the hero banner.");
    } finally {
      setIsUploadingHero(false);
    }
  };

  // Upload Initial Hero Banner Image to Cloudflare R2 (Auto-detects 3:1 ratio)
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const isRight3To1 = Math.abs(ratio - 3.0) <= 0.08;

      if (isRight3To1) {
        // Standard 3:1 Canva format detected - upload directly without asking to crop
        URL.revokeObjectURL(objectUrl);
        toast.info("Standard 3:1 banner format detected (1200×400 / 2400×800). Uploading directly...");
        uploadHeroFileDirectly(file);
      } else {
        // Different ratio detected - ask to crop to 3:1
        const reader = new FileReader();
        reader.onload = () => {
          URL.revokeObjectURL(objectUrl);
          toast.info("Image is not 3:1 ratio. Adjust crop to fit the banner perfectly.");
          setCropperModalState({
            isOpen: true,
            imageSrc: reader.result as string,
            targetType: "hero",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      uploadHeroFileDirectly(file);
    };
    img.src = objectUrl;
  };

  // Save Initial Hero Banner Changes
  const handleSaveHeroBanner = (e: React.FormEvent) => {
    e.preventDefault();

    if (!heroImageUrl.trim()) {
      toast.error("Please provide or upload a banner image.");
      return;
    }

    startTransition(async () => {
      const res = await updateHeroBannerAction({
        imageUrl: heroImageUrl.trim(),
        tagline: heroTagline.trim() || null,
        title: heroTitle.trim() || null,
        subtitle: heroSubtitle.trim() || null,
        primaryCtaText: heroPrimaryCtaText.trim() || null,
        primaryCtaLink: heroPrimaryCtaLink.trim() || null,
        secondaryCtaText: heroSecondaryCtaText.trim() || null,
        secondaryCtaLink: heroSecondaryCtaLink.trim() || null,
        showOverlay: heroShowOverlay,
        textPosition: heroTextPosition,
        imagePositionX: heroPositionX,
        imagePositionY: heroPositionY,
        objectPosition: `${heroPositionX}% ${heroPositionY}%`,
      });

      if (res.success) {
        setHeroBanner(res.data.heroBanner);
        setHeroDialogOpen(false);
        toast.success("Initial hero banner & position updated successfully!");
      } else {
        toast.error(res.error || "Failed to update hero banner.");
      }
    });
  };

  // Reset Initial Hero Banner to Default NiVi Photo
  const handleResetHeroBanner = () => {
    if (!confirm("Reset initial hero banner to default NiVi settings?")) return;

    startTransition(async () => {
      const res = await resetHeroBannerAction();
      if (res.success) {
        setHeroBanner(res.data.heroBanner);
        setHeroImageUrl(res.data.heroBanner.imageUrl);
        setHeroPositionX(res.data.heroBanner.imagePositionX);
        setHeroPositionY(res.data.heroBanner.imagePositionY);
        setHeroDialogOpen(false);
        toast.success("Reset to default NiVi hero banner.");
      } else {
        toast.error(res.error || "Failed to reset hero banner.");
      }
    });
  };

  // Toggle Initial Hero Banner Active / Paused
  const handleToggleHeroActive = () => {
    startTransition(async () => {
      const res = await updateHeroBannerAction({
        active: !heroBanner.active,
      });
      if (res.success) {
        setHeroBanner(res.data.heroBanner);
        toast.success(
          res.data.heroBanner.active
            ? "Initial hero banner is now Active!"
            : "Initial hero banner is now Paused.",
        );
      } else {
        toast.error(res.error || "Failed to toggle hero banner status.");
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
    setBannerPositionX(50);
    setBannerPositionY(50);
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
    setBannerPositionX(campaign.imagePositionX ?? 50);
    setBannerPositionY(campaign.imagePositionY ?? 50);
    setCampaignDialogOpen(true);
  };

  const uploadCampaignFileDirectly = async (file: File) => {
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

  // Banner file upload handler for Campaign (Auto-detects 3:1 ratio)
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const isRight3To1 = Math.abs(ratio - 3.0) <= 0.08;

      if (isRight3To1) {
        // Standard 3:1 Canva format detected - upload directly without asking to crop
        URL.revokeObjectURL(objectUrl);
        toast.info("Standard 3:1 banner format detected (1200×400 / 2400×800). Uploading directly...");
        uploadCampaignFileDirectly(file);
      } else {
        // Different ratio detected - ask to crop to 3:1
        const reader = new FileReader();
        reader.onload = () => {
          URL.revokeObjectURL(objectUrl);
          toast.info("Image is not 3:1 ratio. Adjust crop to fit the banner perfectly.");
          setCropperModalState({
            isOpen: true,
            imageSrc: reader.result as string,
            targetType: "campaign",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      uploadCampaignFileDirectly(file);
    };
    img.src = objectUrl;
  };

  // Handles cropped file from ImageCropperModal
  const handleCroppedFile = async (croppedFile: File) => {
    const target = cropperModalState?.targetType;
    setCropperModalState(null);

    if (target === "hero") {
      await uploadHeroFileDirectly(croppedFile);
    } else if (target === "campaign") {
      await uploadCampaignFileDirectly(croppedFile);
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

    const imagePos = `${bannerPositionX}% ${bannerPositionY}%`;

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
          imagePosition: bannerImageUrl.trim() ? imagePos : null,
          imagePositionX: bannerImageUrl.trim() ? bannerPositionX : null,
          imagePositionY: bannerImageUrl.trim() ? bannerPositionY : null,
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
        // Create new
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
          imagePosition: bannerImageUrl.trim() ? imagePos : null,
          imagePositionX: bannerImageUrl.trim() ? bannerPositionX : null,
          imagePositionY: bannerImageUrl.trim() ? bannerPositionY : null,
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
        setCampaignList((prev) =>
          prev.map((c) => (c.id === activeManagingCampaign.id ? res.data.campaign : c)),
        );

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

  // Preset position helper buttons
  const positionPresets = [
    { label: "Model Focus (85% 15%)", x: 85, y: 15 },
    { label: "Center (50% 50%)", x: 50, y: 50 },
    { label: "Top Center (50% 15%)", x: 50, y: 15 },
    { label: "Left Focus (15% 50%)", x: 15, y: 50 },
    { label: "Right Focus (85% 50%)", x: 85, y: 50 },
    { label: "Bottom Center (50% 85%)", x: 50, y: 85 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5CCBB]/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#073C35]">
              Offers & Banners
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-[#073C35]/10 text-[#073C35] border border-[#073C35]/25 font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              {activeCampaigns.length} Active Offers
            </span>
          </div>
          <p className="text-sm text-[#6B5A4A] mt-1 font-sans">
            Manage homepage visual hero banners, image focal positions, and promotional discount campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "banners" ? (
            <>
              <Button
                onClick={openHeroDialog}
                className="gap-2 shadow-xs bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] rounded-xl font-semibold cursor-pointer"
              >
                <Sliders className="h-4 w-4" />
                <span>Adjust Initial Banner</span>
              </Button>
              <Button
                onClick={handleResetHeroBanner}
                variant="outline"
                className="gap-1.5 shadow-2xs border-[#D5CCBB] bg-[#FFFCF5] text-[#30251F] hover:bg-[#073C35]/8 hover:text-[#073C35] rounded-xl font-medium cursor-pointer"
                title="Reset to default NiVi banner"
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset Default</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={openCreateDialog}
              className="gap-2 shadow-xs bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] rounded-xl font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Offer Campaign</span>
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Pill Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#FFFCF5] p-1.5 rounded-2xl border border-[#D5CCBB] w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "banners"
              ? "bg-[#073C35] text-[#FFFCF5] shadow-xs border border-[#C9A45C]/40"
              : "text-[#6B5A4A] hover:text-[#073C35] hover:bg-[#073C35]/5"
          }`}
        >
          <ImageIcon className="h-4 w-4 text-[#C9A45C]" />
          <span>Homepage Banners & Carousel</span>
          <Badge
            variant={activeTab === "banners" ? "secondary" : "outline"}
            className={`text-[10px] px-1.5 py-0 font-mono ml-0.5 ${
              activeTab === "banners" ? "bg-white/15 text-white" : ""
            }`}
          >
            {carouselSlides.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("offers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "offers"
              ? "bg-[#073C35] text-[#FFFCF5] shadow-xs border border-[#C9A45C]/40"
              : "text-[#6B5A4A] hover:text-[#073C35] hover:bg-[#073C35]/5"
          }`}
        >
          <Tag className="h-4 w-4 text-[#C9A45C]" />
          <span>Promotional Offers & Discounts</span>
          <Badge
            variant={activeTab === "offers" ? "secondary" : "outline"}
            className={`text-[10px] px-1.5 py-0 font-mono ml-0.5 ${
              activeTab === "offers" ? "bg-white/15 text-white" : ""
            }`}
          >
            {campaignList.length}
          </Badge>
        </button>
      </div>

      {/* TAB 1: BANNERS & CAROUSEL */}
      {activeTab === "banners" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* SECTION 1: INITIAL HOMEPAGE HERO BANNER CARD */}
          <Card className="border-[#D5CCBB] bg-[#FFFCF5] shadow-[0_4px_20px_rgba(7,60,53,0.05)] rounded-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-[#D5CCBB]/60 bg-[#E4DDCD]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2.5">
                <Tag className="h-5 w-5 text-primary" />
                <span>Flagship Homepage Hero Banner</span>
                <Badge
                  variant={heroBanner.active ? "default" : "outline"}
                  className="text-[10px] px-2 py-0 ml-1"
                >
                  {heroBanner.active ? "Active on Homepage" : "Paused"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                This is the primary initial banner customers see at the top of your homepage. You can upload any image to Cloudflare R2 and adjust its focal position coordinates.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openHeroDialog}
                className="gap-1.5 text-xs shadow-xs"
              >
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Adjust Image & Position</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleToggleHeroActive}
                className={`h-8 w-8 ${
                  heroBanner.active
                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    : "text-primary hover:bg-primary/10"
                }`}
                title={heroBanner.active ? "Pause initial banner" : "Activate initial banner"}
                disabled={isPending}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Live Visual Card */}
            <div className="lg:col-span-7">
              <div
                className="relative rounded-2xl overflow-hidden border border-neutral-300 shadow-md bg-neutral-950 aspect-[21/9] sm:aspect-[24/9] group cursor-pointer"
                onClick={openHeroDialog}
                title="Click to edit banner image & adjust position"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroBanner.imageUrl || "/nivi-hero-banner-v2.jpg"}
                  alt={heroBanner.title || "Initial Hero Banner"}
                  className="w-full h-full object-cover brightness-[0.92] transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    objectPosition:
                      heroBanner.objectPosition ||
                      `${heroBanner.imagePositionX ?? 85}% ${heroBanner.imagePositionY ?? 15}%`,
                  }}
                />

                {heroBanner.showOverlay !== false && (
                  <>
                    <div
                      className={`absolute inset-0 ${
                        heroBanner.textPosition === "right"
                          ? "bg-gradient-to-l from-black/85 via-black/50 to-transparent right-0 left-auto w-[65%]"
                          : heroBanner.textPosition === "center"
                          ? "bg-black/45"
                          : "bg-gradient-to-r from-black/85 via-black/50 to-transparent w-[65%]"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 p-4 sm:p-6 flex flex-col justify-center text-white ${
                        heroBanner.textPosition === "center"
                          ? "items-center text-center"
                          : heroBanner.textPosition === "right"
                          ? "items-end text-right"
                          : "items-start text-left"
                      }`}
                    >
                      {heroBanner.tagline && (
                        <span className="text-[10px] sm:text-xs font-serif tracking-wider uppercase text-amber-200 border border-brand/40 px-2 py-0.5 rounded-full bg-black/40 mb-1.5">
                          {heroBanner.tagline}
                        </span>
                      )}
                      <h3 className="font-serif text-sm sm:text-lg md:text-xl font-bold leading-tight max-w-sm drop-shadow-sm">
                        {heroBanner.title || "Curated Elegance, Handcrafted with Soul."}
                      </h3>
                      {heroBanner.subtitle && (
                        <p className="text-[10px] sm:text-xs text-neutral-200 line-clamp-1 max-w-xs mt-1">
                          {heroBanner.subtitle}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-white/20 backdrop-blur-xs font-mono">
                    Position: {heroBanner.imagePositionX ?? 85}% X, {heroBanner.imagePositionY ?? 15}% Y
                  </Badge>
                </div>
              </div>
            </div>

            {/* Banner Specs & Quick Details */}
            <div className="lg:col-span-5 space-y-3.5 text-xs">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-primary" />
                    <span>Focal Position:</span>
                  </span>
                  <span className="font-mono font-bold text-primary">
                    X: {heroBanner.imagePositionX ?? 85}% | Y: {heroBanner.imagePositionY ?? 15}%
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-semibold text-foreground">Overlay Mode:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {heroBanner.showOverlay !== false
                      ? `Text Overlay (${heroBanner.textPosition || "left"})`
                      : "Pure Graphic Mode"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-semibold text-foreground">Primary CTA Link:</span>
                  <span className="font-mono text-muted-foreground truncate max-w-[180px]">
                    {heroBanner.primaryCtaLink || "/collections"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Slide Order in Carousel:</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Slide #{((heroBanner.displayOrder ?? 0) + 1)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={openHeroDialog}
                  size="sm"
                  className="flex-1 gap-1.5 text-xs shadow-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Upload & Adjust Banner</span>
                </Button>
                <Button
                  onClick={handleResetHeroBanner}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Reset to default NiVi banner"
                  disabled={isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Default</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: HOMEPAGE HERO CAROUSEL KANBAN DRAG & DROP BOARD */}
      <Card className="border-[#d2c8b5] bg-card shadow-[0_2px_12px_rgba(70,50,20,0.05)] overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border/50 bg-[#ede7d8]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Kanban className="h-5 w-5 text-primary" />
                <span>Homepage Hero Carousel Kanban Board</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Drag and drop slide cards to rearrange their order live on the homepage. Slide #1 displays immediately on initial page load.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5">
              {/* View Switcher: Kanban vs List */}
              <div className="flex items-center bg-background/90 rounded-lg p-0.5 border border-border/60 shadow-2xs">
                <Button
                  type="button"
                  variant={carouselViewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => setCarouselViewMode("kanban")}
                  title="Kanban Cards Board"
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Kanban</span>
                </Button>
                <Button
                  type="button"
                  variant={carouselViewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => setCarouselViewMode("list")}
                  title="Compact List View"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>List</span>
                </Button>
              </div>

              <Badge
                variant="outline"
                className="font-mono text-xs px-2.5 py-1 border-primary/40 text-primary bg-primary/5 shrink-0"
              >
                {carouselSlides.length} Slide{carouselSlides.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {carouselViewMode === "kanban" ? (
            /* ========================================================
               KANBAN VIEW: Drag and Drop Responsive Cards Board
               ======================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carouselSlides.map((slide, idx) => {
                const isHero = slide.type === "hero";
                const isDragging = draggedSlideIndex === idx;
                const isDragOver = dragOverSlideIndex === idx;

                return (
                  <div
                    key={slide.id}
                    draggable={!isPending}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex flex-col rounded-2xl border p-4 transition-all duration-200 select-none ${
                      isDragging
                        ? "opacity-30 scale-[0.97] border-dashed border-primary bg-primary/5 shadow-inner"
                        : isDragOver
                        ? "ring-2 ring-primary border-primary bg-primary/10 shadow-lg -translate-y-1"
                        : slide.active
                        ? "border-border/80 bg-card hover:border-brand/70 hover:shadow-md"
                        : "border-border/40 bg-muted/20 opacity-75"
                    }`}
                  >
                    {/* Top Bar: Drag Handle, Slide Order Badge & Power Toggle */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/40 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Click and drag to reorder slide in carousel"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <Badge
                          variant={idx === 0 ? "default" : "secondary"}
                          className="font-mono text-[10px] px-2 py-0.5 truncate"
                        >
                          {idx === 0 ? "#1 (Initial Load)" : `#${idx + 1}`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={slide.active ? "default" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {slide.active ? "Active" : "Paused"}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => (isHero ? handleToggleHeroActive() : handleToggleCampaign(slide.id))}
                          className={`h-7 w-7 ${
                            slide.active
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              : "text-primary hover:bg-primary/10"
                          }`}
                          title={slide.active ? "Pause slide" : "Activate slide"}
                          disabled={isPending}
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview with Focal Point Overlay */}
                    <div
                      className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-border/80 bg-neutral-950 my-3 group/thumb cursor-pointer shadow-2xs"
                      onClick={() => (isHero ? openHeroDialog() : openEditDialog(slide.campaign))}
                      title="Click to edit banner image & focal position"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        draggable={false}
                        className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 pointer-events-none select-none"
                        style={{
                          objectPosition: isHero
                            ? heroBanner.objectPosition ||
                              `${heroBanner.imagePositionX ?? 85}% ${heroBanner.imagePositionY ?? 15}%`
                            : slide.campaign.imagePosition || "center",
                        }}
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="text-[9px] bg-black/75 text-white border-white/20 backdrop-blur-xs font-mono"
                        >
                          {isHero
                            ? `${heroBanner.imagePositionX ?? 85}% X, ${heroBanner.imagePositionY ?? 15}% Y`
                            : slide.campaign.imagePosition || "50% 50%"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={isHero ? "default" : "outline"}
                          className="text-[9px] bg-background/90 text-foreground border-border/60 shadow-2xs backdrop-blur-xs"
                        >
                          {slide.badge}
                        </Badge>
                      </div>
                    </div>

                    {/* Slide Title & Subtitle */}
                    <div className="flex-1 min-w-0 space-y-1 mb-3">
                      <h4 className="font-serif font-bold text-sm text-foreground truncate" title={slide.title}>
                        {slide.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {slide.subtitle || (isHero ? "Initial Brand Banner" : "Promotional Discount Banner")}
                      </p>
                    </div>

                    {/* Footer: Edit Button & Fallback Reorder Arrows */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-border/40 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => (isHero ? openHeroDialog() : openEditDialog(slide.campaign))}
                        className="text-xs h-7 px-2.5 gap-1.5 shadow-2xs flex-1"
                      >
                        <Sliders className="h-3 w-3 text-primary" />
                        <span>Edit & Position</span>
                      </Button>

                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0 || isPending}
                          onClick={() => handleMoveCarouselSlide(idx, "up")}
                          title="Move Earlier in Carousel"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === carouselSlides.length - 1 || isPending}
                          onClick={() => handleMoveCarouselSlide(idx, "down")}
                          title="Move Later in Carousel"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================
               LIST VIEW: Drag and Drop Rows
               ======================================================== */
            <div className="space-y-2.5">
              {carouselSlides.map((slide, idx) => {
                const isHero = slide.type === "hero";
                const isDragging = draggedSlideIndex === idx;
                const isDragOver = dragOverSlideIndex === idx;

                return (
                  <div
                    key={slide.id}
                    draggable={!isPending}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl border transition-all gap-3 select-none ${
                      isDragging
                        ? "opacity-30 scale-[0.99] border-dashed border-primary bg-primary/5"
                        : isDragOver
                        ? "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
                        : slide.active
                        ? "border-border/70 bg-background/90 hover:bg-background hover:shadow-xs"
                        : "border-border/40 bg-muted/30 opacity-75"
                    }`}
                  >
                    {/* Left: Drag Handle, Reorder position, Thumbnail, and Slide info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Drag Handle & Up/Down Arrows */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                          title="Click and drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={idx === 0 || isPending}
                            onClick={() => handleMoveCarouselSlide(idx, "up")}
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
                            disabled={idx === carouselSlides.length - 1 || isPending}
                            onClick={() => handleMoveCarouselSlide(idx, "down")}
                            title="Move Down in Carousel"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Banner Thumbnail */}
                      <div
                        className="relative h-14 w-28 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0 cursor-pointer group"
                        onClick={() => (isHero ? openHeroDialog() : openEditDialog(slide.campaign))}
                        title="Click to edit banner & position"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          draggable={false}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform pointer-events-none select-none"
                          style={{
                            objectPosition: isHero
                              ? heroBanner.objectPosition ||
                                `${heroBanner.imagePositionX ?? 85}% ${heroBanner.imagePositionY ?? 15}%`
                              : slide.campaign.imagePosition || "center",
                          }}
                        />
                      </div>

                      {/* Slide Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-foreground truncate">
                            {slide.title}
                          </span>
                          <Badge
                            variant={isHero ? "default" : "secondary"}
                            className="text-[10px] px-2 py-0 font-mono"
                          >
                            {slide.badge}
                          </Badge>
                          <Badge
                            variant={slide.active ? "default" : "outline"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {slide.active ? "Active" : "Paused"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{slide.subtitle}</span>
                          {isHero && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-primary">
                                Focal: {heroBanner.imagePositionX ?? 85}% X, {heroBanner.imagePositionY ?? 15}% Y
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => (isHero ? openHeroDialog() : openEditDialog(slide.campaign))}
                        className="text-xs h-8 px-3 gap-1.5"
                      >
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        <span>Edit & Position</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => (isHero ? handleToggleHeroActive() : handleToggleCampaign(slide.id))}
                        className={`h-8 w-8 ${
                          slide.active
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            : "text-primary hover:bg-primary/10"
                        }`}
                        title={slide.active ? "Pause slide" : "Activate slide"}
                        disabled={isPending}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )}

  {/* TAB 2: PROMOTIONAL OFFERS & DISCOUNTS */}
  {activeTab === "offers" && (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
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

      {/* SECTION 3: ALL PROMOTIONAL OFFERS TABLE */}
      <Card className="border-[#d2c8b5] bg-card shadow-[0_2px_12px_rgba(70,50,20,0.05)] overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border/50 bg-[#ede7d8]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <span>All Promotional Offers</span>
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
                {activeCarouselOffers.length} / 5 Offers in Carousel
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
              <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
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
              {orderedCampaigns.map((camp) => {
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
                    {/* Left: Banner preview, and Offer info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Banner Thumbnail */}
                      <div
                        className="relative h-14 w-28 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0 cursor-pointer group"
                        onClick={() => openEditDialog(camp)}
                        title="Click to edit banner & position"
                      >
                        {hasBanner ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={camp.bannerImageUrl!}
                            alt={camp.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            style={{ objectPosition: camp.imagePosition || "center" }}
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
                        title="Edit offer details, banner & position"
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
    </div>
  )}

      {/* DIALOG 1: Edit Initial Homepage Hero Banner & Position */}
      <Dialog open={heroDialogOpen} onOpenChange={setHeroDialogOpen}>
        <DialogContent className="max-w-[620px] w-[calc(100%-2rem)] max-h-[86vh] flex flex-col p-0 overflow-hidden">
          <form onSubmit={handleSaveHeroBanner} className="flex flex-col h-full max-h-[86vh] overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 shrink-0 bg-popover">
              <DialogTitle className="font-serif text-xl flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <span>Edit Initial Homepage Hero Banner</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload whatever image you need and adjust its focal position coordinates so your model or saree details are framed perfectly.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Image Upload Box */}
              <div className="space-y-2">
                <FieldLabel className="text-xs font-semibold">Banner Image (Uploaded to R2) *</FieldLabel>
                {heroImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-neutral-950 h-36 sm:h-44 w-full group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageUrl}
                      alt="Initial Banner Preview"
                      className="w-full h-full object-cover transition-all"
                      style={{ objectPosition: `${heroPositionX}% ${heroPositionY}%` }}
                    />

                    {/* Gradient Overlay Preview */}
                    {heroShowOverlay && (
                      <div
                        className={`absolute inset-0 ${
                          heroTextPosition === "right"
                            ? "bg-gradient-to-l from-black/80 via-black/40 to-transparent right-0 left-auto w-[65%]"
                            : heroTextPosition === "center"
                            ? "bg-black/45"
                            : "bg-gradient-to-r from-black/80 via-black/40 to-transparent w-[65%]"
                        }`}
                      />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background text-foreground text-xs font-medium shadow-sm hover:bg-muted transition-colors">
                        <UploadCloud className="h-3.5 w-3.5 text-primary" />
                        <span>Upload New Image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleHeroFileUpload}
                          disabled={isUploadingHero || isPending}
                        />
                      </label>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-white/20 font-mono">
                        {heroPositionX}% X, {heroPositionY}% Y
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      {isUploadingHero ? (
                        <Spinner className="h-6 w-6 text-primary my-2" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {isUploadingHero ? "Uploading to Cloudflare R2..." : "Click to Upload Banner Image"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Recommended: 1200×400 or 2400×800 px (Canva 3:1 Standard) • Auto-crops if other sizes
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleHeroFileUpload}
                        disabled={isUploadingHero || isPending}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* INTERACTIVE FOCAL POSITION CONTROLLER */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Move className="h-4 w-4 text-primary" />
                    <span>Adjust Image Position (Focal Point)</span>
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] text-primary">
                    {heroPositionX}% X, {heroPositionY}% Y
                  </Badge>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1.5">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {positionPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setHeroPositionX(preset.x);
                          setHeroPositionY(preset.y);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                          heroPositionX === preset.x && heroPositionY === preset.y
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine-Tuning Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Horizontal Position (X)</span>
                      <span className="font-mono font-bold text-foreground">{heroPositionX}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroPositionX}
                      onChange={(e) => setHeroPositionX(parseInt(e.target.value, 10))}
                      className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>Left (0%)</span>
                      <span>Center (50%)</span>
                      <span>Right (100%)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Vertical Position (Y)</span>
                      <span className="font-mono font-bold text-foreground">{heroPositionY}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroPositionY}
                      onChange={(e) => setHeroPositionY(parseInt(e.target.value, 10))}
                      className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>Top (0%)</span>
                      <span>Center (50%)</span>
                      <span>Bottom (100%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEXT OVERLAY & DISPLAY SETTINGS */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Text Overlay & Buttons</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Enable text overlay or choose Pure Graphic Mode if your banner already has text.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHeroShowOverlay(true)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        heroShowOverlay
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Text Overlay
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroShowOverlay(false)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        !heroShowOverlay
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Pure Graphic
                    </button>
                  </div>
                </div>

                {heroShowOverlay && (
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div>
                      <FieldLabel className="text-[11px]">Text Alignment</FieldLabel>
                      <div className="flex items-center gap-1.5 pt-1">
                        {(["left", "center", "right"] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setHeroTextPosition(pos)}
                            className={`flex-1 py-1 rounded-md text-[11px] font-medium capitalize border transition-colors ${
                              heroTextPosition === pos
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="heroTitle" className="text-[11px]">Main Headline</FieldLabel>
                        <Input
                          id="heroTitle"
                          placeholder="e.g. Curated Elegance, Handcrafted with Soul."
                          value={heroTitle}
                          onChange={(e) => setHeroTitle(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="heroTagline" className="text-[11px]">Tagline Badge</FieldLabel>
                        <Input
                          id="heroTagline"
                          placeholder="e.g. Royal Festive Edit"
                          value={heroTagline}
                          onChange={(e) => setHeroTagline(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="heroSubtitle" className="text-[11px]">Description Subtitle</FieldLabel>
                      <Input
                        id="heroSubtitle"
                        placeholder="e.g. Authentic Kanchipuram silks and pure zari weaves handcrafted by generational artisans."
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="text-xs h-8"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="heroPrimaryCtaText" className="text-[11px]">Primary Button Text</FieldLabel>
                        <Input
                          id="heroPrimaryCtaText"
                          placeholder="e.g. Explore Collection"
                          value={heroPrimaryCtaText}
                          onChange={(e) => setHeroPrimaryCtaText(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="heroPrimaryCtaLink" className="text-[11px]">Primary Button URL</FieldLabel>
                        <Input
                          id="heroPrimaryCtaLink"
                          placeholder="e.g. /collections"
                          value={heroPrimaryCtaLink}
                          onChange={(e) => setHeroPrimaryCtaLink(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="heroSecondaryCtaText" className="text-[11px]">Secondary Button Text</FieldLabel>
                        <Input
                          id="heroSecondaryCtaText"
                          placeholder="e.g. Offers"
                          value={heroSecondaryCtaText}
                          onChange={(e) => setHeroSecondaryCtaText(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="heroSecondaryCtaLink" className="text-[11px]">Secondary Button URL</FieldLabel>
                        <Input
                          id="heroSecondaryCtaLink"
                          placeholder="e.g. /offers"
                          value={heroSecondaryCtaLink}
                          onChange={(e) => setHeroSecondaryCtaLink(e.target.value)}
                          className="text-xs h-8"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-3 sm:p-4 border-t border-border/50 shrink-0 bg-muted/40 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHeroDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || isUploadingHero} className="gap-1.5 shadow-xs">
                {isPending && <Spinner className="h-3.5 w-3.5" />}
                <span>Save Banner & Position</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Create or Edit Offer Campaign */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-[540px] w-[calc(100%-2rem)] max-h-[86vh] flex flex-col p-0 overflow-hidden">
          <form onSubmit={handleSaveCampaign} className="flex flex-col h-full max-h-[86vh] overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 shrink-0 bg-popover">
              <DialogTitle className="font-serif text-xl">
                {editingCampaignId ? "Edit Offer Campaign" : "Create New Offer Campaign"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Set discount rules for this campaign. You can link sarees now or at any time later.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-black/5 aspect-[3/1] max-h-36 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerImageUrl}
                        alt="Campaign Banner Preview"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `${bannerPositionX}% ${bannerPositionY}%` }}
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

                    {/* Position Sliders for Offer Banner */}
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Move className="h-3 w-3 text-primary" />
                          <span>Image Position:</span>
                        </span>
                        <span className="font-mono text-primary font-bold">
                          {bannerPositionX}% X, {bannerPositionY}% Y
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-0.5">X (Horizontal)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bannerPositionX}
                            onChange={(e) => setBannerPositionX(parseInt(e.target.value, 10))}
                            className="w-full accent-primary cursor-pointer h-1 bg-muted rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-0.5">Y (Vertical)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bannerPositionY}
                            onChange={(e) => setBannerPositionY(parseInt(e.target.value, 10))}
                            className="w-full accent-primary cursor-pointer h-1 bg-muted rounded"
                          />
                        </div>
                      </div>
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
                        Recommended: 1200×400 or 2400×800 px (Canva 3:1 Standard) • Auto-crops if other sizes
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

            <DialogFooter className="p-3 sm:p-4 border-t border-border/50 shrink-0 bg-muted/40 gap-2 sm:gap-0">
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

      {/* DIALOG 3: Manage Sarees for Campaign */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 shrink-0 bg-popover">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:px-5 border-b border-border/50 shrink-0">
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
                className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                disabled={selectedProductIds.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Sarees Scrollable Checklist */}
          <div className="flex-1 overflow-y-auto min-h-[260px] p-3 sm:p-5 space-y-1.5 divide-y divide-border/30">
            {filteredPickerProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No sarees found matching your search.
              </div>
            ) : (
              filteredPickerProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const otherEnrollment = productActiveCampaignMap.get(p.id);
                const isLockedOther =
                  Boolean(otherEnrollment) &&
                  Boolean(activeManagingCampaign) &&
                  otherEnrollment?.campaignId !== activeManagingCampaign?.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isLockedOther) toggleProductSelect(p.id);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-colors pt-2.5 ${
                      isLockedOther
                        ? "opacity-55 cursor-not-allowed bg-muted/20"
                        : isSelected
                        ? "bg-primary/5 border border-primary/20 cursor-pointer"
                        : "hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 text-primary">
                        {isLockedOther ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative h-11 w-9 rounded overflow-hidden border border-border bg-muted shrink-0">
                        {p.primaryImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.primaryImageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 text-[9px]">
                            No img
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {p.name}
                          </p>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            ({p.sku})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="font-mono font-semibold text-foreground">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                          {p.category && (
                            <>
                              <span>•</span>
                              <span>{p.category}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className={p.stock > 0 ? "text-green-600 font-medium" : "text-destructive"}>
                            {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-3">
                      {isLockedOther ? (
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400 bg-amber-50">
                          Locked: {otherEnrollment?.campaignName}
                        </Badge>
                      ) : isSelected ? (
                        <Badge variant="default" className="text-[10px] gap-1">
                          <Check className="h-3 w-3" />
                          <span>Included</span>
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground hover:text-foreground">
                          Click to add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border/50 shrink-0 bg-muted/40 flex items-center justify-between sm:justify-between w-full">
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

      {/* 4. SEPARATE 3:1 IMAGE CROPPER MODAL */}
      {cropperModalState?.isOpen && (
        <ImageCropperModal
          imageSrc={cropperModalState.imageSrc}
          aspectRatio={3 / 1}
          exportWidth={2400}
          exportHeight={800}
          title={
            cropperModalState.targetType === "hero"
              ? "Adjust Hero Banner Crop (3 : 1)"
              : "Adjust Campaign Banner Crop (3 : 1)"
          }
          subtitle="Drag to position & slide to zoom so your banner fits the 3:1 frame perfectly with zero cutoffs"
          onCrop={handleCroppedFile}
          onClose={() => setCropperModalState(null)}
        />
      )}
    </div>
  );
}
