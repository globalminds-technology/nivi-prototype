import "server-only";
import type { ShippingOption, ShippingRepository } from "@/core/application/ports/shipping-repository";
import { ZohoHttpClient, ZohoApiError } from "../zoho/zoho-http";
import type { ZohoItemRaw } from "../zoho/mappers/item.mapper";

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

const DEFAULT_STANDARD_OPTION: ShippingOption = {
  id: "default-ship-std",
  sku: "SHIP-STD",
  type: "standard",
  name: "Standard Shipping",
  rate: 200,
  rateMinor: 20000,
};

const DEFAULT_EXPRESS_OPTION: ShippingOption = {
  id: "default-ship-exp",
  sku: "SHIP-EXP",
  type: "express",
  name: "Express Delivery",
  rate: 350,
  rateMinor: 35000,
};

export class ZohoShippingRepository implements ShippingRepository {
  private cache: readonly ShippingOption[] | null = null;
  private cacheTime = 0;
  private readonly CACHE_TTL_MS = 30_000; // 30 seconds cache

  constructor(private readonly http: ZohoHttpClient) {}

  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  async getShippingOptions(): Promise<readonly ShippingOption[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.CACHE_TTL_MS) {
      return this.cache;
    }

    try {
      // Query items from Zoho Books
      const res = await this.http.get<ZohoItemsListResponse>("items", {
        search_text: "SHIP-",
        per_page: "50",
      });

      const rawItems = res.items || [];
      const standardItem = rawItems.find((i) => String(i.sku || "").toUpperCase() === "SHIP-STD");
      const expressItem = rawItems.find((i) => String(i.sku || "").toUpperCase() === "SHIP-EXP");

      const standard: ShippingOption = standardItem
        ? {
            id: standardItem.item_id,
            sku: "SHIP-STD",
            type: "standard",
            name: standardItem.name || "Standard Shipping",
            rate: Number(standardItem.rate) || 0,
            rateMinor: Math.round((Number(standardItem.rate) || 0) * 100),
          }
        : DEFAULT_STANDARD_OPTION;

      const express: ShippingOption = expressItem
        ? {
            id: expressItem.item_id,
            sku: "SHIP-EXP",
            type: "express",
            name: expressItem.name || "Express Delivery",
            rate: Number(expressItem.rate) || 0,
            rateMinor: Math.round((Number(expressItem.rate) || 0) * 100),
          }
        : DEFAULT_EXPRESS_OPTION;

      const options = [standard, express];
      this.cache = options;
      this.cacheTime = now;
      return options;
    } catch (err) {
      console.warn("[ZohoShippingRepository] Failed to fetch shipping rates from Zoho, using defaults:", err);
      return [DEFAULT_STANDARD_OPTION, DEFAULT_EXPRESS_OPTION];
    }
  }

  async getOptionByType(type: "standard" | "express"): Promise<ShippingOption> {
    const options = await this.getShippingOptions();
    const hit = options.find((o) => o.type === type);
    if (hit) return hit;
    return type === "express" ? DEFAULT_EXPRESS_OPTION : DEFAULT_STANDARD_OPTION;
  }

  async updateRates(rates: { standardRate?: number; expressRate?: number }): Promise<readonly ShippingOption[]> {
    // 1. Fetch current options to get their Zoho item_ids
    const current = await this.getShippingOptions();
    const standard = current.find((o) => o.type === "standard");
    const express = current.find((o) => o.type === "express");

    // 2. Update Standard if provided and valid Zoho item exists
    if (rates.standardRate !== undefined && standard && standard.id && !standard.id.startsWith("default-")) {
      try {
        await this.http.put<ZohoItemDetailResponse>(`items/${standard.id}`, {
          rate: rates.standardRate,
        });
      } catch (err) {
        console.error(`[ZohoShippingRepository] Failed to update Standard rate in Zoho:`, err);
        throw err;
      }
    }

    // 3. Update Express if provided and valid Zoho item exists
    if (rates.expressRate !== undefined && express && express.id && !express.id.startsWith("default-")) {
      try {
        await this.http.put<ZohoItemDetailResponse>(`items/${express.id}`, {
          rate: rates.expressRate,
        });
      } catch (err) {
        console.error(`[ZohoShippingRepository] Failed to update Express rate in Zoho:`, err);
        throw err;
      }
    }

    // Invalidate cache immediately
    this.clearCache();
    return this.getShippingOptions();
  }
}
