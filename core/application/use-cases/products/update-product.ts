import { type Product, type ProductProps } from "../../../domain/entities/product";
import { NotFoundError } from "../../../domain/errors/domain-errors";
import { toCalendarDate } from "../../../domain/value-objects/calendar-date";
import { Money } from "../../../domain/value-objects/money";
import { createOffer } from "../../../domain/value-objects/offer";
import type { ProductInputDto } from "../../dto/product.dto";
import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { ProductRepository } from "../../ports/product-repository";

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export class UpdateProduct {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(id: string, dto: Partial<ProductInputDto>): Promise<Product> {
    const existing = await this.productRepo.getById(id);
    if (!existing) {
      throw new NotFoundError("Product", id);
    }

    const updates: Partial<Mutable<ProductProps>> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.price !== undefined) updates.price = Money.ofMajor(dto.price);
    if (dto.costPrice !== undefined) {
      updates.costPrice = dto.costPrice !== null ? Money.ofMajor(dto.costPrice) : null;
    }
    if (dto.stock !== undefined) updates.stock = dto.stock;
    if (dto.taxId !== undefined) updates.taxId = dto.taxId;
    if (dto.taxPercentage !== undefined) updates.taxPercentage = dto.taxPercentage;
    if (dto.primaryImageUrl !== undefined) updates.primaryImageUrl = dto.primaryImageUrl || null;
    if (dto.category !== undefined) updates.category = dto.category || null;
    if (dto.gallery !== undefined) updates.gallery = dto.gallery;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.status !== undefined) updates.status = dto.status;

    if (dto.offer !== undefined) {
      updates.offer = dto.offer
        ? createOffer(
            dto.offer.type === "percent"
              ? {
                  active: dto.offer.active,
                  type: "percent",
                  percent: dto.offer.value,
                  label: dto.offer.label,
                  expiry: dto.offer.expiry ? toCalendarDate(dto.offer.expiry) : null,
                }
              : {
                  active: dto.offer.active,
                  type: "flat",
                  amount: Money.ofMajor(dto.offer.value),
                  label: dto.offer.label,
                  expiry: dto.offer.expiry ? toCalendarDate(dto.offer.expiry) : null,
                },
          )
        : null;
    }

    const updated = await this.productRepo.update(id, updates);

    // Invalidate product specific and global catalog tags
    await this.cacheInvalidator.revalidateTag("products");
    await this.cacheInvalidator.revalidateTag(`product:${existing.sku}`);
    await this.cacheInvalidator.revalidateTag(`product:sku:${existing.sku.toLowerCase()}`);
    await this.cacheInvalidator.revalidateTag(`product:id:${id}`);
    if (updated.sku.toLowerCase() !== existing.sku.toLowerCase()) {
      await this.cacheInvalidator.revalidateTag(`product:${updated.sku}`);
      await this.cacheInvalidator.revalidateTag(`product:sku:${updated.sku.toLowerCase()}`);
    }

    return updated;
  }
}
