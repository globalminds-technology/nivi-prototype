"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  FolderPlus,
  ImagePlus,
  Layers,
  Plus,
  Save,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createProductAction,
  deleteProductImageAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/app/actions/admin-products";
import { uploadGalleryImageAction } from "@/app/actions/media";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ProductInputDto } from "@/core/application/dto/product.dto";
import type { Category } from "@/core/domain/entities/category";

export interface InitialProductData {
  id?: string;
  sku: string;
  name: string;
  description: string;
  price: number; // in Rupees - Selling Price
  costPrice?: number | null; // in Rupees - Purchase Price
  vendorId?: string | null;
  vendorName?: string | null;
  stock: number;
  category?: string | null;
  taxId?: string | null;
  taxPercentage?: number;
  primaryImageUrl?: string | null;
  gallery: string[];
  tags: string[];
  status: "active" | "inactive";
  attributes?: {
    fabric?: string | null;
    occasion: string[];
    style: string[];
    comfort: string[];
    border?: string | null;
    colourPalette?: string | null;
    primaryColour?: string | null;
  };
  offer?: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label: string;
    expiry?: string | null;
  } | null;
}

interface ProductFormProps {
  initialData?: InitialProductData;
  isEditing?: boolean;
  availableCategories?: Category[];
  availableVendors?: Array<{ id: string; name: string }>;
}

const COMMON_TAGS = ["featured", "new_arrival", "bestseller", "bridal", "handcrafted", "limited_edition"];

const FABRIC_OPTIONS = [
  "Kanchi Cotton",
  "Sungudi Cotton",
  "Kora Organza",
  "Banarasi Katan Silk",
  "Maheshwari Cotton",
  "Silk Cotton",
  "Soft Silk",
];

const OCCASION_OPTIONS = [
  "Daily wear",
  "Office or formal wear",
  "Festive or family function",
  "Wedding or grand occasion",
  "Temple visit",
  "Reception / Engagement",
];

const STYLE_OPTIONS = [
  "Traditional and elegant",
  "Modern and minimal",
  "Rich and royal",
  "Simple and graceful",
  "Dramatic festive",
];

const COMFORT_OPTIONS = [
  "Light and comfortable",
  "Lightweight and breathable",
  "Structured and crisp",
  "Rich texture and luxurious feel",
  "Versatile for many occasions",
];

const BORDER_OPTIONS = [
  "Grand zari border",
  "Small or subtle border",
  "Contrast colour border",
  "Minimal or no prominent border",
];

const PALETTE_OPTIONS = [
  "Rich and vibrant",
  "Soft and pastel",
  "Earthy and muted",
  "Classic and timeless",
];

const PRIMARY_COLOUR_OPTIONS = [
  "Red / Maroon",
  "Green / Emerald / Olive",
  "Royal Blue / Navy / Indigo",
  "Blush Pink / Rose",
  "Lavender / Purple",
  "Mint / Sage",
  "Beige / Cream / Ivory",
  "Rust / Mustard / Turmeric",
  "Coral / Peach / Fuchsia",
  "Black / Charcoal",
];

interface StagedGalleryFile {
  id: string;
  file: File;
  preview: string;
}

export function ProductForm({
  initialData,
  isEditing = false,
  availableCategories = [],
  availableVendors = [],
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab Stepper State (4 Steps: Details -> Media -> Quiz & Styling -> Merchandising)
  const [activeTab, setActiveTab] = useState<"details" | "media" | "attributes" | "tags">("details");

  // Form State - Basics
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "");
  const [costPrice, setCostPrice] = useState(
    initialData?.costPrice !== undefined && initialData?.costPrice !== null
      ? String(initialData.costPrice)
      : "",
  );
  const [vendorId, setVendorId] = useState(initialData?.vendorId ?? "");
  const [stock, setStock] = useState(initialData?.stock !== undefined ? String(initialData.stock) : "0");
  const [status, setStatus] = useState<"active" | "inactive">(initialData?.status ?? "active");

  // Media - Primary Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.primaryImageUrl ?? null);
  const [imageModified, setImageModified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Media - Additional Photos (Staged locally, uploaded only on final submit)
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const [existingGallery, setExistingGallery] = useState<string[]>(initialData?.gallery ?? []);
  const [stagedGalleryFiles, setStagedGalleryFiles] = useState<StagedGalleryFile[]>([]);
  const [isDraggingAdditional, setIsDraggingAdditional] = useState(false);

  // Tags State
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [customTagInput, setCustomTagInput] = useState("");

  // Saree Quiz Attributes State
  const [fabric, setFabric] = useState(initialData?.attributes?.fabric ?? "");
  const [occasions, setOccasions] = useState<string[]>(initialData?.attributes?.occasion ?? []);
  const [styles, setStyles] = useState<string[]>(initialData?.attributes?.style ?? []);
  const [comforts, setComforts] = useState<string[]>(initialData?.attributes?.comfort ?? []);
  const [border, setBorder] = useState(initialData?.attributes?.border ?? "");
  const [colourPalette, setColourPalette] = useState(initialData?.attributes?.colourPalette ?? "");
  const [primaryColour, setPrimaryColour] = useState(initialData?.attributes?.primaryColour ?? "");

  const toggleOccasion = (val: string) => {
    setOccasions((prev) => (prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]));
  };

  const toggleStyle = (val: string) => {
    setStyles((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]));
  };

  const toggleComfort = (val: string) => {
    setComforts((prev) => (prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]));
  };

  // SKU auto-formatting: Replace spaces with hyphens, uppercase
  const handleSkuChange = (val: string) => {
    const formatted = val.replace(/\s+/g, "-").toUpperCase();
    setSku(formatted);
  };

  // Tag helpers
  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setCustomTagInput("");
    }
  };

  // Explicitly reset form to fresh clean state
  const resetForm = () => {
    setSku("");
    setName("");
    setCategory("");
    setDescription("");
    setPrice("");
    setCostPrice("");
    setVendorId("");
    setStock("0");
    setStatus("active");
    setImageFile(null);
    setImagePreview(null);
    setImageModified(false);
    setExistingGallery([]);
    setStagedGalleryFiles([]);
    setTags([]);
    setCustomTagInput("");
    setFabric("");
    setOccasions([]);
    setStyles([]);
    setComforts([]);
    setBorder("");
    setColourPalette("");
    setPrimaryColour("");
    setActiveTab("details");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = "";
  };

  // Reset form whenever opening fresh "Add Product"
  useEffect(() => {
    if (!isEditing && !initialData) {
      resetForm();
    }
  }, [isEditing, initialData]);

  // Primary Photo Handler
  const handleSelectPrimaryFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Primary photo size exceeds 5MB limit.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageModified(true);
  };

  const handleRemovePrimaryImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageModified(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Additional Photos Handler (Multi-select, staged locally, NO immediate upload)
  const handleSelectAdditionalFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const currentTotal = existingGallery.length + stagedGalleryFiles.length;
    const remainingSlots = 11 - currentTotal;

    if (remainingSlots <= 0) {
      toast.error("Gallery limit reached. Maximum 11 additional photos allowed.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const validFiles = fileList
      .filter((f) => allowedTypes.includes(f.type))
      .slice(0, remainingSlots);

    if (validFiles.length < fileList.length) {
      toast.warning(
        `Added ${validFiles.length} photo(s). Some were skipped due to format or 11-slot limit.`,
      );
    } else {
      toast.success(`Selected ${validFiles.length} photo(s). They will upload on final submit.`);
    }

    const newItems: StagedGalleryFile[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setStagedGalleryFiles((prev) => [...prev, ...newItems]);
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = "";
  };

  const removeStagedFile = (id: string) => {
    setStagedGalleryFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const removeExistingGalleryImage = (index: number) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSku = sku.trim().replace(/\s+/g, "-").toUpperCase();
    if (!cleanSku) {
      toast.error("Please provide a SKU code.");
      setActiveTab("details");
      return;
    }

    if (!name.trim()) {
      toast.error("Please provide a product title.");
      setActiveTab("details");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please provide a valid selling price.");
      setActiveTab("details");
      return;
    }

    const stockNum = parseInt(stock, 10);
    const parsedStock = isNaN(stockNum) || stockNum < 0 ? 0 : stockNum;

    const costPriceNum = costPrice.trim() !== "" ? parseFloat(costPrice) : null;
    const parsedCostPrice = costPriceNum !== null && !isNaN(costPriceNum) && costPriceNum >= 0 ? costPriceNum : null;

    // Preserve existing offer if product already had one linked via Offers Manager
    const offerPayload = initialData?.offer
      ? {
          active: initialData.offer.active,
          type: initialData.offer.type,
          value: initialData.offer.value,
          label: initialData.offer.label,
          expiry: initialData.offer.expiry ? initialData.offer.expiry : null,
        }
      : null;

    startTransition(async () => {
      // 1. Upload any staged additional photos now
      const newlyUploadedUrls: string[] = [];
      if (stagedGalleryFiles.length > 0) {
        for (let i = 0; i < stagedGalleryFiles.length; i++) {
          const item = stagedGalleryFiles[i];
          const slotIndex = existingGallery.length + i + 2;

          const formData = new FormData();
          formData.append("sku", cleanSku);
          formData.append("index", String(slotIndex));
          formData.append("file", item.file);

          const uploadRes = await uploadGalleryImageAction(formData);
          if (!uploadRes.success) {
            toast.error(`Photo upload failed for ${item.file.name}: ${uploadRes.error}`);
            return;
          }
          newlyUploadedUrls.push(uploadRes.data.publicUrl);
        }
      }

      const finalGallery = [...existingGallery, ...newlyUploadedUrls];

      const payloadPrimaryImage = imageFile
        ? (initialData?.primaryImageUrl ?? null)
        : (imagePreview && !imagePreview.startsWith("blob:") ? imagePreview : null);

      const payload: ProductInputDto = {
        sku: cleanSku,
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || null,
        price: priceNum,
        costPrice: parsedCostPrice,
        vendorId: vendorId ? vendorId.trim() : null,
        stock: parsedStock,
        taxId: null,
        taxPercentage: 0,
        primaryImageUrl: payloadPrimaryImage,
        gallery: finalGallery,
        tags,
        offer: offerPayload,
        status,
        attributes: {
          fabric: fabric.trim() || null,
          occasion: occasions,
          style: styles,
          comfort: comforts,
          border: border.trim() || null,
          colourPalette: colourPalette.trim() || null,
          primaryColour: primaryColour.trim() || null,
        },
      };

      let targetProductId = initialData?.id;

      if (isEditing && targetProductId) {
        const res = await updateProductAction(targetProductId, payload);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
      } else {
        const res = await createProductAction(payload);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        targetProductId = res.data.id;
      }

      // If a primary image was changed/uploaded, upload it
      if (targetProductId && imageModified) {
        if (imageFile) {
          const form = new FormData();
          form.append("file", imageFile);
          const uploadRes = await uploadProductImageAction(targetProductId, form);
          if (!uploadRes.success) {
            toast.error(`Product saved, but primary photo upload failed: ${uploadRes.error}`);
            return;
          }
        } else if (!imagePreview && isEditing) {
          const delRes = await deleteProductImageAction(targetProductId);
          if (!delRes.success) {
            toast.error(`Failed to remove primary photo: ${delRes.error}`);
            return;
          }
        }
      }

      toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
      if (!isEditing) {
        resetForm();
      }
      router.push("/admin");
      router.refresh();
    });
  };

  const totalPhotosCount = existingGallery.length + stagedGalleryFiles.length;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5CCBB]/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 w-9 p-0 rounded-xl border-[#D5CCBB] bg-[#FFFCF5] hover:bg-[#073C35]/8 text-[#073C35]" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#073C35]">
              {isEditing ? `Edit: ${initialData?.name ?? "Product"}` : "Add New Saree"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5A4A] mt-0.5 font-sans">
              Manage product details, pricing, stock ledger, and media gallery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline", size: "sm", className: "text-xs border-[#D5CCBB] bg-[#FFFCF5] hover:bg-[#073C35]/8 text-[#30251F] rounded-xl" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isPending} className="gap-2 text-xs shadow-xs bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] font-semibold rounded-xl cursor-pointer">
            {isPending ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                <span>Saving Saree...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isEditing ? "Update Saree" : "Save Saree"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Controlled Tabs / Stepper (4 Steps) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "details" | "media" | "attributes" | "tags")}
        className="w-full space-y-6"
      >
        <TabsList className="grid grid-cols-4 w-full h-12 bg-[#FFFCF5] border border-[#D5CCBB] p-1 rounded-2xl shadow-2xs">
          <TabsTrigger value="details" className="text-xs gap-1.5 data-[state=active]:bg-[#073C35] data-[state=active]:text-[#FFFCF5] data-[state=active]:shadow-xs rounded-xl font-medium">
            <span className="w-4 h-4 rounded-full bg-[#073C35]/15 data-[state=active]:bg-white/20 text-[#073C35] data-[state=active]:text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="truncate">Details</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs gap-1.5 data-[state=active]:bg-[#073C35] data-[state=active]:text-[#FFFCF5] data-[state=active]:shadow-xs rounded-xl font-medium">
            <span className="w-4 h-4 rounded-full bg-[#073C35]/15 data-[state=active]:bg-white/20 text-[#073C35] data-[state=active]:text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="truncate">Media ({totalPhotosCount + (imagePreview ? 1 : 0)})</span>
          </TabsTrigger>
          <TabsTrigger value="attributes" className="text-xs gap-1.5 data-[state=active]:bg-[#073C35] data-[state=active]:text-[#FFFCF5] data-[state=active]:shadow-xs rounded-xl font-medium">
            <span className="w-4 h-4 rounded-full bg-[#073C35]/15 data-[state=active]:bg-white/20 text-[#073C35] data-[state=active]:text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="truncate">Quiz & Styling</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs gap-1.5 data-[state=active]:bg-[#073C35] data-[state=active]:text-[#FFFCF5] data-[state=active]:shadow-xs rounded-xl font-medium">
            <span className="w-4 h-4 rounded-full bg-[#073C35]/15 data-[state=active]:bg-white/20 text-[#073C35] data-[state=active]:text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="truncate">Tags ({tags.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DETAILS */}
        <TabsContent value="details" className="space-y-6">
          <Card className="shadow-[0_4px_20px_rgba(7,60,53,0.04)] border-[#D5CCBB] bg-[#FFFCF5] rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">General Information</CardTitle>
              <CardDescription>Primary identification, weave name, category, and pricing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="sku">SKU Code *</FieldLabel>
                  <Input
                    id="sku"
                    required
                    value={sku}
                    onChange={(e) => handleSkuChange(e.target.value)}
                    placeholder="e.g. SC-001"
                    className="font-mono text-sm uppercase"
                    disabled={isPending || isEditing}
                  />
                  <FieldDescription>Unique inventory code (letters, numbers, hyphens)</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="name">Product Title *</FieldLabel>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Peacock Blue Handwoven Silk Cotton Saree"
                    disabled={isPending}
                  />
                  <FieldDescription>Displayed across storefront banners and catalog cards</FieldDescription>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="category">Weave Category</FieldLabel>
                  <div className="flex items-center gap-2">
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Select Weave Category --</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.slug} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Link
                      href="/admin/categories"
                      target="_blank"
                      className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 px-2.5 shrink-0" })}
                      title="Manage categories in new tab"
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Link>
                  </div>
                  <FieldDescription>Assign this saree to a collection category</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Store Visibility</FieldLabel>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        status === "active"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("inactive")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        status === "inactive"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Draft
                    </button>
                  </div>
                </Field>
              </div>

              {/* Price, Cost Price, Preferred Vendor & Stock Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <Field>
                  <FieldLabel htmlFor="price">Selling Price (INR) *</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                      ₹
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="3850"
                      className="pl-7 font-mono text-sm"
                      disabled={isPending}
                    />
                  </div>
                  <FieldDescription>Customer retail price (incl. GST)</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="costPrice">Cost Price (INR)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                      ₹
                    </span>
                    <Input
                      id="costPrice"
                      type="number"
                      step="any"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="2600"
                      className="pl-7 font-mono text-sm"
                      disabled={isPending}
                    />
                  </div>
                  <FieldDescription>Internal cost for margin tracking</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="vendorId">Preferred Vendor</FieldLabel>
                  <select
                    id="vendorId"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- None (Optional) --</option>
                    {availableVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <FieldDescription>Zoho Books supplier (optional)</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="stock">Available Stock *</FieldLabel>
                  <Input
                    id="stock"
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="8"
                    className="font-mono text-sm"
                    disabled={isPending}
                  />
                  <FieldDescription>Available units in stock</FieldDescription>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="description">Product Description</FieldLabel>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  placeholder="Describe the weave, fabric purity, zari details, pallu design, length, blouse piece, and care instructions..."
                />
              </Field>

              {/* Stepper Navigation */}
              <div className="flex justify-end pt-4 border-t border-border/60">
                <Button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className="gap-2 text-xs shadow-xs"
                >
                  <span>Next: Photos & Media</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: MEDIA */}
        <TabsContent value="media" className="space-y-6">
          {/* Primary Photo */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Primary Product Photo</CardTitle>
              <CardDescription>
                Main catalog showcase image displayed across the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSelectPrimaryFile(file);
                }}
                disabled={isPending}
              />

              {imagePreview ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl border border-border/80 bg-muted/20">
                  <div className="relative h-44 w-36 rounded-lg border border-border overflow-hidden bg-muted/40 shadow-xs shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Primary" className="h-full w-full object-cover" />
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="bg-emerald-900/90 text-emerald-100 text-[10px] font-medium backdrop-blur-xs">
                        {imageFile ? "Ready on Save" : "Active Photo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {imageFile ? imageFile.name : `${name || sku || "Primary"} Photo`}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {imageFile
                        ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB • Staged for final submit`
                        : "Current primary showcase image"}
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Change Photo</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePrimaryImage}
                        disabled={isPending}
                        className="text-xs text-destructive hover:bg-destructive/10 h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleSelectPrimaryFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-emerald-600 bg-emerald-500/10"
                      : "border-border/80 hover:border-emerald-700/60 hover:bg-muted/30"
                  }`}
                >
                  <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground">Click to upload or drag & drop primary photo</h4>
                  <p className="text-xs text-muted-foreground mt-1">Accepts JPG, PNG, and WebP up to 5MB</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Photos (Gallery - Staged locally, uploaded only on final submit) */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Additional Photos</CardTitle>
                <CardDescription>
                  Select multiple angles, close-ups and pallu views ({totalPhotosCount}/11 slots used).
                </CardDescription>
              </div>

              <div>
                <input
                  ref={additionalFileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleSelectAdditionalFiles(e.target.files);
                  }}
                  disabled={totalPhotosCount >= 11 || isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => additionalFileInputRef.current?.click()}
                  disabled={totalPhotosCount >= 11 || isPending}
                  className="gap-2 h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Choose Photos (Multi-select)</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalPhotosCount === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingAdditional(true);
                  }}
                  onDragLeave={() => setIsDraggingAdditional(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingAdditional(false);
                    if (e.dataTransfer.files) handleSelectAdditionalFiles(e.dataTransfer.files);
                  }}
                  onClick={() => additionalFileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDraggingAdditional
                      ? "border-emerald-600 bg-emerald-500/10"
                      : "border-border/80 hover:border-emerald-700/60 hover:bg-muted/30"
                  }`}
                >
                  <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground">Click to select multiple photos or drag & drop</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select several images at once. They will upload automatically when you click Save.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {/* Existing Saved Gallery Images */}
                  {existingGallery.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted/30 shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Angle ${idx + 2}`} className="h-full w-full object-cover" />
                      <div className="absolute top-1 left-1 bg-black/70 text-[9px] text-white font-mono px-1.5 py-0.5 rounded">
                        #{String(idx + 2).padStart(2, "0")}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingGalleryImage(idx)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Staged New Gallery Images (Waiting to upload on final submit) */}
                  {stagedGalleryFiles.map((staged, idx) => {
                    const slotNum = existingGallery.length + idx + 2;
                    return (
                      <div
                        key={staged.id}
                        className="group relative aspect-square rounded-lg border-2 border-emerald-500/40 overflow-hidden bg-muted/30 shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={staged.preview} alt="Staged" className="h-full w-full object-cover" />
                        <div className="absolute top-1 left-1 bg-emerald-800 text-[9px] text-white font-mono px-1.5 py-0.5 rounded">
                          #{String(slotNum).padStart(2, "0")}
                        </div>
                        <div className="absolute bottom-1 inset-x-1 bg-black/70 text-[9px] text-emerald-300 font-medium px-1 py-0.5 rounded text-center truncate">
                          Ready to Save
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStagedFile(staged.id)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center transition-opacity"
                          title="Remove staged photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("details")}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Details</span>
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("attributes")}
              className="gap-2 text-xs shadow-xs"
            >
              <span>Next: Saree Quiz & Styling</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>

        {/* TAB 3: QUIZ & STYLING ATTRIBUTES */}
        <TabsContent value="attributes" className="space-y-6">
          {/* Saree Quiz & Recommendation Attributes */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold">Saree Quiz & Styling Attributes</CardTitle>
              </div>
              <CardDescription>
                Attributes used to match customer answers in the &quot;Find Your Perfect Saree&quot; styling quiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dropdowns Row: Fabric, Border, Colour Palette, Primary Colour */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel className="text-xs">Fabric / Saree Type</FieldLabel>
                  <select
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    disabled={isPending}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select fabric...</option>
                    {FABRIC_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel className="text-xs">Border Type</FieldLabel>
                  <select
                    value={border}
                    onChange={(e) => setBorder(e.target.value)}
                    disabled={isPending}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select border...</option>
                    {BORDER_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel className="text-xs">Colour Palette</FieldLabel>
                  <select
                    value={colourPalette}
                    onChange={(e) => setColourPalette(e.target.value)}
                    disabled={isPending}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select palette...</option>
                    {PALETTE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel className="text-xs">Primary Colour</FieldLabel>
                  <select
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    disabled={isPending}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select colour...</option>
                    {PRIMARY_COLOUR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-select: Occasions */}
              <div className="space-y-1.5 pt-1">
                <FieldLabel className="text-xs">Suitable Occasions (Multi-select)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASION_OPTIONS.map((occ) => {
                    const selected = occasions.includes(occ);
                    return (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => toggleOccasion(occ)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                        <span>{occ}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-select: Style Preference */}
              <div className="space-y-1.5">
                <FieldLabel className="text-xs">Style Preference (Multi-select)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_OPTIONS.map((st) => {
                    const selected = styles.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStyle(st)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                        <span>{st}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-select: Comfort & Drape Feel */}
              <div className="space-y-1.5">
                <FieldLabel className="text-xs">Comfort & Drape Feel (Multi-select)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {COMFORT_OPTIONS.map((comf) => {
                    const selected = comforts.includes(comf);
                    return (
                      <button
                        key={comf}
                        type="button"
                        onClick={() => toggleComfort(comf)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                        <span>{comf}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stepper Navigation: From Attributes to Tags */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("media")}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Media</span>
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("tags")}
              className="gap-2 text-xs shadow-xs"
            >
              <span>Next: Merchandising & Tags</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>

        {/* TAB 4: MERCHANDISING & DISPLAY TAGS */}
        <TabsContent value="tags" className="space-y-6">
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Display Tags</CardTitle>
              <CardDescription>
                Tag products for homepage spotlights, new arrivals section, and curated collections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                      <span className="capitalize">{tag.replace(/_/g, " ")}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="pt-2">
                <FieldLabel className="text-xs">Add Custom Tag</FieldLabel>
                <div className="flex items-center gap-2 max-w-sm mt-1">
                  <Input
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="e.g. pure_zari, summer_silk"
                    className="h-8 text-xs"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim() || isPending}
                    className="h-8 text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stepper Navigation: Final Submission */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("attributes")}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Quiz & Styling</span>
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2 text-xs shadow-xs">
              {isPending ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  <span>Saving Saree...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{isEditing ? "Update Saree" : "Save Saree"}</span>
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
