import { describe, expect, it } from "vitest";
import { toCalendarDate } from "@/core/domain/value-objects/calendar-date";
import { Money } from "@/core/domain/value-objects/money";
import { toSku } from "@/core/domain/value-objects/sku";
import { ZohoItemMapper, type ZohoItemRaw } from "./item.mapper";

describe("ZohoItemMapper", () => {
  const apiDomain = "https://www.zohoapis.in";
  const orgId = "123456789";

  it("maps Zoho item with custom_fields array to domain Product", () => {
    const raw: ZohoItemRaw = {
      item_id: "item_999",
      name: "Kanchipuram Silk",
      sku: "KANJI-01",
      description: "Traditional silk saree with gold border",
      rate: 8500,
      actual_available_stock: 7,
      tax_id: "tax_gst_5",
      tax_percentage: 5,
      status: "active",
      image_name: "primary.jpg",
      custom_fields: [
        {
          api_name: "cf_gallery_images",
          value: "https://r2.nivi.in/KANJI-01/02.jpg\nhttps://r2.nivi.in/KANJI-01/03.jpg",
        },
        {
          api_name: "cf_display_tags",
          value: "Featured, New Arrivals",
        },
        {
          api_name: "cf_offer_active",
          value: true,
        },
        {
          api_name: "cf_offer_type",
          value: "percent",
        },
        {
          api_name: "cf_offer_value",
          value: 15,
        },
        {
          api_name: "cf_offer_label",
          value: "Festive 15%",
        },
        {
          api_name: "cf_offer_expiry",
          value: "2026-11-01",
        },
      ],
    };

    const product = ZohoItemMapper.toDomain(raw, apiDomain, orgId);

    expect(product.id).toBe("item_999");
    expect(product.sku).toBe("KANJI-01");
    expect(product.name).toBe("Kanchipuram Silk");
    expect(product.price.minor).toBe(850000);
    expect(product.stock).toBe(7);
    expect(product.primaryImageUrl).toBe("/api/images/zoho/item_999");
    expect(product.gallery).toEqual([
      "https://r2.nivi.in/KANJI-01/02.jpg",
      "https://r2.nivi.in/KANJI-01/03.jpg",
    ]);
    expect(product.tags).toEqual(["Featured", "New Arrivals"]);
    expect(product.offer).not.toBeNull();
    expect(product.offer?.active).toBe(true);
    expect(product.offer?.label).toBe("Festive 15%");
    expect(product.offer?.type).toBe("percent");
    if (product.offer?.type === "percent") {
      expect(product.offer.percent).toBe(15);
    }
  });

  it("maps custom_field_hash structure accurately", () => {
    const raw: ZohoItemRaw = {
      item_id: "item_888",
      name: "Cotton Saree",
      sku: "COT-01",
      rate: 1500,
      stock_on_hand: 12,
      custom_field_hash: {
        cf_gallery_images: "https://r2.nivi.in/COT-01/02.jpg",
        cf_display_tags: "Daily Wear",
        cf_offer_active: "false",
        cf_offer_type: "flat",
        cf_offer_value: 200,
        cf_offer_label: "Flat 200 Off",
      },
    };

    const product = ZohoItemMapper.toDomain(raw, apiDomain, orgId);

    expect(product.sku).toBe("COT-01");
    expect(product.price.minor).toBe(150000);
    expect(product.stock).toBe(12);
    expect(product.gallery.length).toBe(1);
    expect(product.tags).toEqual(["Daily Wear"]);
    expect(product.offer?.active).toBe(false);
    expect(product.offer?.type).toBe("flat");
  });

  it("converts product props into Zoho Books API payload with cf_ custom fields", () => {
    const payload = ZohoItemMapper.toZohoPayload({
      name: "Banarasi Georgette",
      sku: toSku("BAN-01"),
      price: Money.ofMajor(12000),
      gallery: ["https://r2.nivi.in/BAN-01/02.jpg"],
      tags: ["Featured"],
      offer: {
        active: true,
        type: "percent",
        percent: 10,
        label: "Autumn 10",
        expiry: toCalendarDate("2026-10-31"),
      },
    });

    expect(payload.name).toBe("Banarasi Georgette");
    expect(payload.rate).toBe(12000);

    const customFields = payload.custom_fields as Array<{ api_name: string; value: unknown }>;
    expect(customFields).toBeDefined();

    const findCf = (name: string) => customFields.find((c) => c.api_name === name)?.value;

    expect(findCf("cf_gallery_images")).toBe("https://r2.nivi.in/BAN-01/02.jpg");
    expect(findCf("cf_display_tags")).toBe("Featured");
    expect(findCf("cf_offer_active")).toBe(true);
    expect(findCf("cf_offer_type")).toBe("percent");
    expect(findCf("cf_offer_value")).toBe(10);
  });

  it("includes inventory tracking fields when creating an item or setting stock", () => {
    const payload = ZohoItemMapper.toZohoPayload({
      name: "Tracked Silk Saree",
      sku: toSku("SILK-01"),
      price: Money.ofMajor(2500),
      stock: 15,
    });

    expect(payload.product_type).toBe("goods");
    expect(payload.item_type).toBe("sales_and_purchases");
    expect(payload.can_be_sold).toBe(true);
    expect(payload.can_be_purchased).toBe(true);
    expect(payload.track_inventory).toBe(true);
    expect(payload.inventory_valuation_method).toBe("fifo");
    expect(payload.initial_stock).toBe(15);
    expect(payload.initial_stock_rate).toBe(2500);
    expect(payload.inventory_account_id).toBeDefined();
    expect(payload.purchase_account_id).toBeDefined();
    expect(payload.account_id).toBeDefined();
  });
});
