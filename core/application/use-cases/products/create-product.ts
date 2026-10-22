import { type Product, type ProductProps } from "../../../domain/entities/product";
import { ConflictError } from "../../../domain/errors/domain-errors";
import { toCalendarDate } from "../../../domain/value-objects/calendar-date";
import { Money } from "../../../domain/value-objects/money";
import { createOffer } from "../../../domain/value-objects/offer";
import { toSku } from "../../../domain/value-objects/sku";
import type { ProductInputDto } from "../../dto/product.dto";
import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { ProductRepository } from "../../ports/product-repository";

export class CreateProduct {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(dto: ProductInputDto): Promise<Product> {
    const sku = toSku(dto.sku);
    const existing = await this.productRepo.getBySku(sku);
    if (existing) {
      throw new ConflictError(`Product with SKU ${dto.sku} already exists`);
    }

    const offer = dto.offer
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

    const props: ProductProps = {
      id: "", // Assigned by Zoho during create
      sku,
      name: dto.name,
      description: dto.description,
      price: Money.ofMajor(dto.price),
      costPrice: dto.costPrice !== undefined && dto.costPrice !== null ? Money.ofMajor(dto.costPrice) : null,
      vendorId: dto.vendorId ?? null,
      stock: dto.stock,
      taxId: dto.taxId ?? null,
      taxPercentage: dto.taxPercentage,
      primaryImageUrl: dto.primaryImageUrl || null,
      category: dto.category ?? null,
      gallery: dto.gallery,
      tags: dto.tags,
      offer,
      status: dto.status,
      attributes: dto.attributes
        ? {
            fabric: dto.attributes.fabric ?? null,
            occasion: dto.attributes.occasion ?? [],
            style: dto.attributes.style ?? [],
            comfort: dto.attributes.comfort ?? [],
            border: dto.attributes.border ?? null,
            colourPalette: dto.attributes.colourPalette ?? null,
            primaryColour: dto.attributes.primaryColour ?? null,
          }
        : undefined,
    };

    const created = await this.productRepo.create(props);

    // Invalidate catalog cache
    await this.cacheInvalidator.revalidateTag("products");

    return created;
  }
}
