import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductForm, type InitialProductData } from "@/components/admin/product-form";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import { categoryRepository } from "@/infrastructure/categories/category-repository";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await container.getProductById().execute(id);
    return {
      title: `Edit ${product.name} · Nivi Admin`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Edit Product · Nivi Admin",
      robots: { index: false, follow: false },
    };
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await connection();
  const { id } = await params;

  let product;
  try {
    const useCase = container.getAdminProductById();
    product = await useCase.execute(id);
  } catch {
    notFound();
  }

  const [categories, vendors] = await Promise.all([
    categoryRepository.list(),
    container.getVendors(),
  ]);

  const initialData: InitialProductData = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category ?? null,
    description: product.description,
    price: Money.toMajor(product.price),
    costPrice: product.costPrice ? Money.toMajor(product.costPrice) : null,
    vendorId: product.vendorId ?? null,
    vendorName: product.vendorName ?? null,
    stock: product.stock,
    taxId: product.taxId,
    taxPercentage: product.taxPercentage,
    primaryImageUrl: product.primaryImageUrl,
    gallery: [...product.gallery],
    tags: [...product.tags],
    status: product.status,
    offer: product.offer
      ? {
          active: product.offer.active,
          type: product.offer.type,
          value:
            product.offer.type === "percent"
              ? product.offer.percent
              : Money.toMajor(product.offer.amount),
          label: product.offer.label,
          expiry: product.offer.expiry ?? null,
        }
      : null,
    attributes: product.attributes
      ? {
          fabric: product.attributes.fabric ?? null,
          occasion: [...(product.attributes.occasion ?? [])],
          style: [...(product.attributes.style ?? [])],
          comfort: [...(product.attributes.comfort ?? [])],
          border: product.attributes.border ?? null,
          colourPalette: product.attributes.colourPalette ?? null,
          primaryColour: product.attributes.primaryColour ?? null,
        }
      : undefined,
  };

  return (
    <div className="py-2">
      <ProductForm
        initialData={initialData}
        isEditing={true}
        availableCategories={categories}
        availableVendors={vendors}
      />
    </div>
  );
}
