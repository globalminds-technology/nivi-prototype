import type { Metadata } from "next";
import { connection } from "next/server";
import { CategoryManager } from "@/components/admin/category-manager";
import { categoryRepository } from "@/infrastructure/categories/category-repository";

export const instant = false;

export const metadata: Metadata = {
  title: "Categories Management — The Saree Studio Console",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await connection();
  const categories = await categoryRepository.list();

  return <CategoryManager initialCategories={categories} />;
}
