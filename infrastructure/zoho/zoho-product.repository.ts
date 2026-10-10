import "server-only";
import type { Product, ProductProps } from "@/core/domain/entities/product";
import { NotFoundError } from "@/core/domain/errors/domain-errors";
import { Money } from "@/core/domain/value-objects/money";
import type { Sku } from "@/core/domain/value-objects/sku";
import type { ProductFilter, ProductRepository } from "@/core/application/ports/product-repository";
import { env } from "../config/env";
import { ZohoHttpClient, ZohoApiError } from "./zoho-http";
import { ZohoItemMapper, type ZohoItemRaw } from "./mappers/item.mapper";

interface ZohoItemsListResponse {
  code: number;
  message: string;
  items: ZohoItemRaw[];
}

interface ZohoItemDetailResponse {
  code: number;
  message: string;
  item: ZohoItemRaw;
}

export class ZohoProductRepository implements ProductRepository {
  constructor(private readonly http: ZohoHttpClient) {}

  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    const config = env();
    if (!config.ZOHO_ORG_ID) return [];

    const queryParams: Record<string, string> = {
      per_page: "200",
    };

    if (filter?.status === "active") {
      queryParams.filter_by = "Status.Active";
    } else if (filter?.status === "inactive") {
      queryParams.filter_by = "Status.Inactive";
    } else {
      queryParams.filter_by = "Status.All";
    }

    const response = await this.http.get<ZohoItemsListResponse>("items", queryParams);

    const items = response.items || [];
    let products = await Promise.all(
      items.map(async (raw) => {
        // If the summary item already has custom fields, map directly
        if (raw.custom_fields && raw.custom_fields.length > 0) {
          return ZohoItemMapper.toDomain(raw, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
        }
        // Otherwise fetch full single item detail to ensure all custom_fields (tags, gallery, offer) are loaded
        try {
          const detailed = await this.getById(raw.item_id);
          if (detailed) return detailed;
        } catch {
          // fallback to summary item
        }
        return ZohoItemMapper.toDomain(raw, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
      }),
    );

    if (filter?.status) {
      products = products.filter((p) => p.status === filter.status);
    }
    if (filter?.tag) {
      const tagLower = filter.tag.toLowerCase();
      products = products.filter((p) => p.tags.some((t) => t.toLowerCase() === tagLower));
    }
    if (filter?.hasOffer !== undefined) {
      products = products.filter((p) => (p.offer !== null) === filter.hasOffer);
    }

    return products;
  }

  async getBySku(sku: Sku): Promise<Product | null> {
    const config = env();
    if (!config.ZOHO_ORG_ID) return null;

    const response = await this.http.get<ZohoItemsListResponse>("items", {
      search_text: sku,
    });

    const match = (response.items || []).find((item) => {
      const extracted = ZohoItemMapper.extractSku(item);
      return (
        extracted.toLowerCase() === sku.toLowerCase() ||
        item.sku?.toLowerCase() === sku.toLowerCase() ||
        item.item_id === sku
      );
    });

    if (!match) return null;

    // Fetch full single item detail to ensure all custom_fields are loaded
    return this.getById(match.item_id);
  }

  async getById(id: string): Promise<Product | null> {
    const config = env();
    if (!config.ZOHO_ORG_ID) return null;

    try {
      const response = await this.http.get<ZohoItemDetailResponse>(`items/${id}`);
      if (!response.item) return null;
      console.log(`[zoho-repo:getById] Raw item ${id}: rate=${response.item.rate}, purchase_rate=${response.item.purchase_rate}, stock=${response.item.stock_on_hand}, actual_available=${response.item.actual_available_stock}`);
      return ZohoItemMapper.toDomain(response.item, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
    } catch (err: unknown) {
      // Check if 404
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async create(props: ProductProps): Promise<Product> {
    const payload = ZohoItemMapper.toZohoPayload(props);
    let response: ZohoItemDetailResponse;
    try {
      response = await this.http.post<ZohoItemDetailResponse>("items", payload);
    } catch (err: unknown) {
      if (
        err instanceof ZohoApiError &&
        err.code === 8 &&
        (payload.initial_stock !== undefined || payload.track_inventory)
      ) {
        console.warn(
          "[zoho-repo:create] Zoho organization has inventory tracking disabled in preferences. Retrying as standard goods item...",
        );
        const fallbackPayload = { ...payload };
        delete fallbackPayload.track_inventory;
        delete fallbackPayload.initial_stock;
        delete fallbackPayload.initial_stock_rate;
        delete fallbackPayload.inventory_account_id;
        response = await this.http.post<ZohoItemDetailResponse>("items", fallbackPayload);
      } else {
        throw err;
      }
    }
    console.log("[zoho-repo:create] Zoho Books POST response item:", {
      id: response.item.item_id,
      name: response.item.name,
      rate: response.item.rate,
      purchase_rate: response.item.purchase_rate,
      stock: response.item.stock_on_hand,
    });

    const targetRate = props.price ? Money.toMajor(props.price) : 0;
    const targetPurchaseRate = props.costPrice ? Money.toMajor(props.costPrice) : 0;

    // If Zoho Books ignored rates during creation, ensure they are set via an immediate PUT
    if (
      (targetRate > 0 && Number(response.item.rate) !== targetRate) ||
      (targetPurchaseRate > 0 && Number(response.item.purchase_rate) !== targetPurchaseRate)
    ) {
      console.log(`[zoho-repo:create] Rates not fully saved on POST. Enforcing via immediate PUT...`);
      try {
        const putRes = await this.http.put<ZohoItemDetailResponse>(`items/${response.item.item_id}`, {
          rate: targetRate,
          purchase_rate: targetPurchaseRate,
        });
        console.log(`[zoho-repo:create] Immediate PUT result: rate=${putRes.item.rate}, purchase_rate=${putRes.item.purchase_rate}`);
        response.item = putRes.item;
      } catch (putErr) {
        console.warn("[zoho-repo:create] Immediate PUT error:", putErr);
      }
    }

    const config = env();
    return ZohoItemMapper.toDomain(response.item, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
  }

  async update(id: string, updates: Partial<ProductProps>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError("Zoho Item", id);
    }

    const payload = ZohoItemMapper.toZohoPayload(updates, true);
    console.log("[zoho-repo:update] Target Item ID:", id);
    console.log("[zoho-repo:update] Updates:", updates);
    console.log("[zoho-repo:update] Payload sent to Zoho Books PUT /items/" + id + ":", JSON.stringify(payload, null, 2));

    let response: ZohoItemDetailResponse;
    try {
      response = await this.http.put<ZohoItemDetailResponse>(`items/${id}`, payload);
      console.log(`[zoho-repo:update] Zoho Books PUT success. Returned item: rate=${response.item.rate}, purchase_rate=${response.item.purchase_rate}, stock_on_hand=${response.item.stock_on_hand}, initial_stock=${response.item.initial_stock}`);
    } catch (err: unknown) {
      // Zoho error 2034: "Item type cannot be changed for Items having transactions"
      // or error 1007: initial stock cannot be modified once transactions exist
      // or error 8: invalid element initial_stock / inventory fields on PUT
      if (
        err instanceof ZohoApiError &&
        (err.code === 2034 || err.code === 1007 || err.code === 8 || err.message.toLowerCase().includes("transaction") || err.message.toLowerCase().includes("invalid element"))
      ) {
        console.warn(
          `[zoho-repo:update] Item ${id} rejected locked inventory fields in Zoho Books. Retrying with clean payload... (reason: ${err.message})`,
        );
        delete payload.item_type;
        delete payload.product_type;
        delete payload.track_inventory;
        delete payload.initial_stock;
        delete payload.initial_stock_rate;
        delete payload.inventory_account_id;
        delete payload.purchase_account_id;
        response = await this.http.put<ZohoItemDetailResponse>(`items/${id}`, payload);
        console.log("[zoho-repo:update] Retry succeeded. Returned item:", {
          item_id: response.item.item_id,
          name: response.item.name,
          rate: response.item.rate,
          purchase_rate: response.item.purchase_rate,
        });
      } else {
        throw err;
      }
    }

    const targetRate = updates.price !== undefined ? Money.toMajor(updates.price) : undefined;
    const targetPurchaseRate = updates.costPrice !== undefined ? (updates.costPrice ? Money.toMajor(updates.costPrice) : 0) : undefined;

    if (
      (targetRate !== undefined && Number(response.item.rate) !== targetRate) ||
      (targetPurchaseRate !== undefined && Number(response.item.purchase_rate) !== targetPurchaseRate)
    ) {
      console.log(`[zoho-repo:update] Rates not saved on main PUT (rate: ${response.item.rate}, purchase_rate: ${response.item.purchase_rate}). Enforcing rate PUT...`);
      try {
        const ratePayload: Record<string, unknown> = {};
        if (targetRate !== undefined) ratePayload.rate = targetRate;
        if (targetPurchaseRate !== undefined) ratePayload.purchase_rate = targetPurchaseRate;
        const putRateRes = await this.http.put<ZohoItemDetailResponse>(`items/${id}`, ratePayload);
        response.item = putRateRes.item;
      } catch (rateErr) {
        console.warn("[zoho-repo:update] Direct rate PUT error:", rateErr);
      }
    }

    // In Zoho Books, PUT /items only modifies item attributes.
    // If inventory tracking is enabled in Zoho, stock adjustments are recorded via Inventory Adjustment.
    if (updates.stock !== undefined && updates.stock !== existing.stock) {
      const diff = updates.stock - existing.stock;
      console.log(`[zoho-repo:update] Stock difference detected: current=${existing.stock}, new=${updates.stock}, diff=${diff}`);
      try {
        const adjPayload = {
          date: new Date().toISOString().slice(0, 10),
          reason: "Stock adjustment from admin portal",
          adjustment_type: "quantity",
          line_items: [
            {
              item_id: id,
              quantity_adjusted: diff,
              adjustment_account_id: process.env.ZOHO_COGS_ACCOUNT_ID || "4251796000000000567",
            },
          ],
        };
        console.log("[zoho-repo:update] Posting inventory adjustment:", JSON.stringify(adjPayload, null, 2));
        const adjRes = await this.http.post<{ code: number; message: string }>("inventoryadjustments", adjPayload);
        console.log("[zoho-repo:update] Inventory adjustment response:", adjRes);

        const refreshed = await this.getById(id);
        if (refreshed) {
          return refreshed;
        }
      } catch (adjErr: unknown) {
        if (adjErr instanceof ZohoApiError && adjErr.code === 103001) {
          console.warn("[zoho-repo:update] Inventory tracking is currently disabled in Zoho Books organization preferences. Enable it under Settings > Preferences > Items to record stock ledger adjustments.");
        } else {
          console.warn("[zoho-repo:update] Inventory adjustment warning:", adjErr);
        }
      }
    }

    const config = env();
    return ZohoItemMapper.toDomain(response.item, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
  }

  async uploadPrimaryImage(id: string, imageBlob: Blob | Uint8Array, filename: string): Promise<string> {
    const ext = filename.toLowerCase().split(".").pop();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

    const blob =
      imageBlob instanceof Blob
        ? imageBlob
        : new Blob([imageBlob.buffer as ArrayBuffer], { type: contentType });

    const formData = new FormData();
    formData.append("image", blob, filename);

    await this.http.post(`items/${id}/image`, formData);

    return `/api/images/zoho/${id}`;
  }

  async getItemImage(id: string): Promise<{ data: Uint8Array; contentType: string } | null> {
    return this.http.getImageBinary(`items/${id}/image`);
  }

  async deletePrimaryImage(id: string): Promise<void> {
    await this.http.delete(`items/${id}/image`);
  }
}
