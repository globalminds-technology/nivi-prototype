import type { Category } from "../../core/domain/entities/category";
import { MOCK_CATEGORIES } from "../../data/mock-catalog";

export class CategoryRepository {
  private categories: Category[] = [...MOCK_CATEGORIES];

  async list(): Promise<Category[]> {
    return [...this.categories];
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return this.categories.find((c) => c.slug === slug) ?? null;
  }

  async get(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id || c.slug === id) ?? null;
  }
}

export const categoryRepository = new CategoryRepository();

