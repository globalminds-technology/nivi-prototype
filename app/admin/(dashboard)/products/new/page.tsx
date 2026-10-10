import type { Metadata } from "next";
import { connection } from "next/server";
import { ProductForm } from "@/components/admin/product-form";
import { categoryRepository } from "@/infrastructure/categories/category-repository";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Product · Nivi Admin",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  await connection();
  const categories = await categoryRepository.list();

  return (
    <div className="py-2">
      <ProductForm key={crypto.randomUUID()} isEditing={false} availableCategories={categories} />
    </div>
  );
}
