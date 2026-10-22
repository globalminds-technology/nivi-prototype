"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  FolderPlus,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteCategoryAction,
  getCategoryUploadUrlAction,
  uploadCategoryCoverAction,
  upsertCategoryAction,
} from "@/app/actions/admin-categories";
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
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/core/domain/entities/category";

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImageUrl(cat.imageUrl || null);
    setImageFile(null);
    setImagePreview(cat.imageUrl || null);
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }

    setImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast.error("Please provide both category name and slug.");
      return;
    }

    startTransition(async () => {
      let finalImageUrl = imageUrl;

      // 1. If a new image file was picked, upload to R2 under categories/{slug}.jpg
      if (imageFile) {
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append("slug", slug.trim().toLowerCase());
          formData.append("file", imageFile);

          const uploadRes = await uploadCategoryCoverAction(formData);
          if (!uploadRes.success) {
            toast.error(uploadRes.error);
            setUploadingImage(false);
            return;
          }

          finalImageUrl = uploadRes.data.publicUrl;
        } catch (uploadErr) {
          console.error("Failed uploading category cover photo:", uploadErr);
          toast.error("Failed uploading cover photo.");
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // 2. Save category record
      const res = await upsertCategoryAction({
        id: editingCategory?.id || slug.trim().toLowerCase(),
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        imageUrl: finalImageUrl,
      });

      if (res.success) {
        toast.success(editingCategory ? "Category updated successfully!" : "Category created successfully!");
        setCategories((prev) => {
          const idx = prev.findIndex((c) => c.slug === res.data.slug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data;
            return next;
          }
          return [...prev, res.data];
        });
        setDialogOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (slugToDelete: string) => {
    if (!confirm(`Are you sure you want to delete this category? Products mapped to it will remain in Zoho Books.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCategoryAction(slugToDelete);
      if (res.success) {
        toast.success("Category deleted successfully.");
        setCategories((prev) => prev.filter((c) => c.slug !== slugToDelete));
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5CCBB]/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#073C35]">
              Product Categories
            </h1>
            <Badge variant="outline" className="font-mono text-xs text-[#073C35] bg-[#073C35]/10 border-[#073C35]/25">
              {categories.length} Total
            </Badge>
          </div>
          <p className="text-sm text-[#6B5A4A] mt-1 font-sans">
            Manage your store collections and category cover artwork. Mapped to your inventory via the category attribute.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2 shadow-xs bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] rounded-xl font-semibold cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </div>

      {/* Categories Grid or Empty State */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D5CCBB] p-12 text-center bg-[#FFFCF5] my-8 shadow-xs">
          <Layers className="mx-auto h-10 w-10 text-[#073C35]/40 mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#30251F]">No Categories Created Yet</h3>
          <p className="text-xs text-[#6B5A4A] mt-1 max-w-md mx-auto font-sans">
            You haven&apos;t created any categories yet. Click &quot;New Category&quot; above to create your first collection.
          </p>
          <Button onClick={openCreateDialog} className="mt-4 gap-2 text-xs bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] rounded-xl font-semibold">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Category</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
          <Card key={cat.slug} className="group overflow-hidden rounded-xl border border-[#D5CCBB] bg-[#FFFCF5] shadow-[0_2px_10px_rgba(7,60,53,0.04)] hover:shadow-[0_6px_20px_rgba(7,60,53,0.08)] hover:border-[#073C35]/40 transition-all flex flex-col justify-between p-0 gap-0">
            <div>
              {/* Cover Image */}
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-t-xl bg-[#E4DDCD]/40 border-b border-[#D5CCBB]">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-[#6B5A4A]/50 p-2 text-center">
                    <Layers className="h-6 w-6 mb-1 opacity-40 text-[#073C35]" />
                    <span className="text-[10px] font-sans">No Image</span>
                  </div>
                )}

                <div className="absolute top-1.5 right-1.5">
                  <Badge className="bg-[#FFFCF5]/95 text-[#30251F] text-[9px] font-mono border border-[#D5CCBB] backdrop-blur-xs px-1.5 py-0 shadow-2xs">
                    {cat.slug}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold tracking-tight text-[#30251F] font-serif truncate" title={cat.name}>
                  {cat.name}
                </CardTitle>
                {cat.description && (
                  <CardDescription className="text-[11px] text-[#6B5A4A] line-clamp-1 mt-0.5 font-sans" title={cat.description}>
                    {cat.description}
                  </CardDescription>
                )}
              </CardHeader>
            </div>

            {/* Actions */}
            <CardContent className="p-2.5 pt-1.5 border-t border-[#D5CCBB]/50 mt-1 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(cat)}
                className="gap-1 text-[11px] h-7 px-2 border-[#D5CCBB] text-[#073C35] hover:bg-[#073C35]/8 rounded-lg cursor-pointer"
              >
                <Pencil className="h-2.5 w-2.5" />
                <span>Edit</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(cat.slug)}
                disabled={isPending}
                className="text-xs h-7 w-7 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-lg cursor-pointer p-0"
                title="Delete category"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription>
              Upload a cover photo and configure the collection details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <Field>
              <FieldLabel htmlFor="catName">Category Name *</FieldLabel>
              <Input
                id="catName"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Silk Cotton"
                required
                disabled={isPending || uploadingImage}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="catSlug">Slug (URL Identifier) *</FieldLabel>
              <Input
                id="catSlug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. silk-cotton"
                required
                className="font-mono text-xs"
                disabled={isPending || uploadingImage}
              />
              <FieldDescription>
                Unique web-safe URL identifier for this collection.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="catDesc">Description</FieldLabel>
              <Textarea
                id="catDesc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short tagline for storefront category banner..."
                disabled={isPending || uploadingImage}
              />
            </Field>

            {/* Cover Photo Upload */}
            <div className="space-y-2">
              <FieldLabel>Category Cover Photo</FieldLabel>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-20 w-24 rounded-lg overflow-hidden border border-border shrink-0 bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageFileSelect}
                    disabled={isPending || uploadingImage}
                  />
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-medium text-foreground transition-colors">
                    <UploadCloud className="h-4 w-4" />
                    <span>{imagePreview ? "Change Photo" : "Upload Cover Photo"}</span>
                  </div>
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Saved to <code>categories/{slug || "slug"}.jpg</code> in your R2 bucket.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending || uploadingImage}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || uploadingImage} className="gap-2">
                {isPending || uploadingImage ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
