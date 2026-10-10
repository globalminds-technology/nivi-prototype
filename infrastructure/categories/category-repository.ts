import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { Category } from "@/core/domain/entities/category";
import { container } from "@/infrastructure/di/container";

const IMAGES_FILE = path.join(process.cwd(), "data", "category-images.json");

interface ZohoCategoryRaw {
  category_id: string;
  name: string;
  description?: string;
  url?: string;
  parent_category_id?: string;
  visibility?: boolean;
}

interface ZohoCategoriesResponse {
  code: number;
  message: string;
  categories: ZohoCategoryRaw[];
}

export class CategoryRepository {
  private async getImageMap(): Promise<Record<string, string>> {
    try {
      const content = await fs.readFile(IMAGES_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async saveImageMap(map: Record<string, string>): Promise<void> {
    try {
      await fs.mkdir(path.dirname(IMAGES_FILE), { recursive: true });
      await fs.writeFile(IMAGES_FILE, JSON.stringify(map, null, 2), "utf-8");
    } catch (err) {
      console.error("[CategoryRepository] Failed writing category-images.json:", err);
    }
  }

  async list(): Promise<Category[]> {
    try {
      const http = container.getZohoHttp();
      const res = await http.get<ZohoCategoriesResponse>("categories");
      const rawCategories = res.categories || [];
      const imageMap = await this.getImageMap();

      // Filter out ROOT or invalid categories
      const validZohoCategories: Category[] = rawCategories
        .filter((c) => c.category_id !== "-1" && c.name?.toUpperCase() !== "ROOT")
        .map((c, index) => {
          const slug = (c.url || c.name || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "-");
          return {
            id: c.category_id,
            name: c.name,
            slug,
            description: c.description || null,
            imageUrl: imageMap[slug] || imageMap[c.category_id] || null,
            displayOrder: index + 1,
          };
        });

      return validZohoCategories;
    } catch (err) {
      console.error("[CategoryRepository] Failed fetching categories from Zoho Books:", err);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const all = await this.list();
    const clean = slug.toLowerCase().trim();
    const exact = all.find((c) => c.slug.toLowerCase() === clean);
    if (exact) return exact;

    const cleanCompact = clean.replace(/[^a-z0-9]/g, "");
    const compactMatch = all.find(
      (c) =>
        c.slug.replace(/[^a-z0-9]/g, "") === cleanCompact ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanCompact
    );
    if (compactMatch) return compactMatch;

    return (
      all.find(
        (c) =>
          c.slug.toLowerCase().includes(clean) ||
          clean.includes(c.slug.toLowerCase()) ||
          c.name.toLowerCase().includes(clean) ||
          clean.includes(c.name.toLowerCase())
      ) ?? null
    );
  }

  async upsert(category: Category): Promise<Category> {
    const http = container.getZohoHttp();
    const imageMap = await this.getImageMap();
    const cleanSlug = category.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");

    // Check if category already exists in Zoho
    const existing = await this.list();
    const match = existing.find(
      (c) =>
        (category.id && c.id === category.id) ||
        c.slug.toLowerCase() === cleanSlug ||
        c.name.toLowerCase() === category.name.trim().toLowerCase(),
    );

    let savedId = category.id;

    if (match && match.id && /^\d+$/.test(match.id)) {
      // Update existing in Zoho
      savedId = match.id;
      await http.put(`categories/${match.id}`, {
        name: category.name.trim(),
        description: category.description || "",
      });
    } else {
      // Create new in Zoho
      const res = await http.post<{ code: number; category: ZohoCategoryRaw }>("categories", {
        name: category.name.trim(),
        parent_category_id: "-1",
        description: category.description || "",
      });
      if (res.category?.category_id) {
        savedId = res.category.category_id;
      }
    }

    // Save cover image if provided
    if (category.imageUrl) {
      imageMap[cleanSlug] = category.imageUrl;
      if (savedId) imageMap[savedId] = category.imageUrl;
      await this.saveImageMap(imageMap);
    }

    return {
      ...category,
      id: savedId || cleanSlug,
      slug: cleanSlug,
      imageUrl: category.imageUrl || (savedId ? imageMap[savedId] : null) || imageMap[cleanSlug] || null,
    };
  }

  async delete(slugOrId: string): Promise<void> {
    const http = container.getZohoHttp();
    const all = await this.list();
    const target = all.find(
      (c) =>
        c.id === slugOrId ||
        c.slug.toLowerCase() === slugOrId.toLowerCase(),
    );

    if (target && target.id && /^\d+$/.test(target.id)) {
      try {
        await http.delete(`categories/${target.id}`);
      } catch (err) {
        console.error(`[CategoryRepository] Failed deleting category ${target.id} from Zoho:`, err);
      }
    }

    // Clean up image mapping
    const imageMap = await this.getImageMap();
    if (target) {
      delete imageMap[target.slug];
      delete imageMap[target.id];
      await this.saveImageMap(imageMap);
    }
  }
}

export const categoryRepository = new CategoryRepository();
