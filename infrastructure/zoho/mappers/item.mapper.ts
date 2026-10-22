import "server-only";
import { createProduct, type Product, type ProductProps } from "@/core/domain/entities/product";
import { toCalendarDate } from "@/core/domain/value-objects/calendar-date";
import { Money } from "@/core/domain/value-objects/money";
import { createOffer, type Offer } from "@/core/domain/value-objects/offer";
import { toSku, type Sku } from "@/core/domain/value-objects/sku";

export interface ZohoCustomFieldRaw {
  customfield_id?: string;
  api_name?: string;
  placeholder?: string;
  label?: string;
  value?: unknown;
}

export interface ZohoItemRaw {
  item_id: string;
  name: string;
  sku?: string;
  description?: string;
  rate: number;
  actual_available_stock?: number;
  stock_on_hand?: number;
  initial_stock?: number;
  tax_id?: string;
  tax_percentage?: number;
  status?: string;
  image_name?: string;
  image_document_id?: string;
  custom_fields?: ZohoCustomFieldRaw[];
  custom_field_hash?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ZohoItemMapper {
  /**
   * Extracts a custom field's value matching by field name (case-insensitive, ignoring 'cf_' prefix).
   */
  private static getCustomFieldValue(item: ZohoItemRaw, fieldName: string): unknown {
    const cleanKey = fieldName.toLowerCase().replace(/^cf_/, "");

    // 1. Try custom_field_hash first
    if (item.custom_field_hash) {
      for (const [k, v] of Object.entries(item.custom_field_hash)) {
        if (k.toLowerCase().replace(/^cf_/, "") === cleanKey) {
          return v;
        }
      }
    }

    // 2. Try custom_fields array
    if (Array.isArray(item.custom_fields)) {
      for (const cf of item.custom_fields) {
        const identifiers = [cf.api_name, cf.placeholder, cf.label].filter(Boolean) as string[];
        for (const id of identifiers) {
          if (id.toLowerCase().replace(/^cf_/, "") === cleanKey) {
            return cf.value;
          }
        }
      }
    }

    return undefined;
  }

  static extractSku(raw: ZohoItemRaw): Sku {
    if (raw.sku && raw.sku.trim()) {
      return toSku(raw.sku);
    }
    if (raw.name && raw.name.trim()) {
      return toSku(raw.name, raw.item_id);
    }
    return toSku(raw.item_id || `ITEM-${Date.now()}`);
  }

  static toDomain(raw: ZohoItemRaw, apiDomain: string, orgId: string): Product {
    const sku = this.extractSku(raw);

    // Primary image: route through secure internal proxy which streams Zoho photo or serves brand placeholder
    const primaryImageUrl = raw.item_id ? `/api/images/zoho/${raw.item_id}` : null;

    // 1. Gallery images
    const galleryRaw = this.getCustomFieldValue(raw, "gallery_images");
    let galleryUrls: string[] = [];
    if (typeof galleryRaw === "string" && galleryRaw.trim()) {
      galleryUrls = galleryRaw
        .split(/[\r\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean);
    } else if (Array.isArray(galleryRaw)) {
      galleryUrls = galleryRaw.map(String).filter(Boolean);
    }

    // 2. Display tags
    const tagsRaw = this.getCustomFieldValue(raw, "display_tags");
    let displayTags: string[] = [];
    if (typeof tagsRaw === "string" && tagsRaw.trim()) {
      displayTags = tagsRaw
        .split(/[,;\n]+/)
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(tagsRaw)) {
      displayTags = tagsRaw.map(String).map((t) => t.trim()).filter(Boolean);
    }

    // 3. Offer fields
    const offerActiveRaw = this.getCustomFieldValue(raw, "offer_active");
    const offerActive =
      offerActiveRaw === true ||
      offerActiveRaw === "true" ||
      offerActiveRaw === 1 ||
      offerActiveRaw === "1";

    const offerTypeRaw = String(this.getCustomFieldValue(raw, "offer_type") || "").toLowerCase();
    const offerValueRaw = Number(this.getCustomFieldValue(raw, "offer_value") || 0);
    const offerLabel = String(this.getCustomFieldValue(raw, "offer_label") || "").trim();
    const offerExpiryRaw = this.getCustomFieldValue(raw, "offer_expiry");

    let offer: Offer | null = null;
    if (offerValueRaw > 0 && (offerTypeRaw === "percent" || offerTypeRaw === "flat")) {
      try {
        offer = createOffer(
          offerTypeRaw === "percent"
            ? {
                active: offerActive,
                type: "percent",
                percent: offerValueRaw,
                label: offerLabel,
                expiry: offerExpiryRaw ? toCalendarDate(String(offerExpiryRaw).slice(0, 10)) : null,
              }
            : {
                active: offerActive,
                type: "flat",
                amount: Money.ofMajor(offerValueRaw),
                label: offerLabel,
                expiry: offerExpiryRaw ? toCalendarDate(String(offerExpiryRaw).slice(0, 10)) : null,
              },
        );
      } catch (err) {
        console.warn(`Skipping invalid offer data for item ${raw.item_id}:`, err);
      }
    }

    // 4. Saree Quiz Attributes
    const parseMulti = (val: unknown): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
      if (typeof val === "string") {
        return val.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      }
      return [String(val).trim()].filter(Boolean);
    };

    const parseSingle = (val: unknown): string | null => {
      if (val === undefined || val === null) return null;
      const str = String(val).trim();
      return str.length > 0 ? str : null;
    };

    const fabricVal = parseSingle(this.getCustomFieldValue(raw, "fabric_type"));
    const occasionVal = parseMulti(this.getCustomFieldValue(raw, "occasion"));
    const styleVal = parseMulti(this.getCustomFieldValue(raw, "style_preference"));
    const comfortVal = parseMulti(this.getCustomFieldValue(raw, "comfort_feel"));
    const borderVal = parseSingle(this.getCustomFieldValue(raw, "border_type"));
    const paletteVal = parseSingle(this.getCustomFieldValue(raw, "colour_palette"));
    const primaryColourVal = parseSingle(this.getCustomFieldValue(raw, "primary_colour"));

    const hasAttributes =
      fabricVal !== null ||
      occasionVal.length > 0 ||
      styleVal.length > 0 ||
      comfortVal.length > 0 ||
      borderVal !== null ||
      paletteVal !== null ||
      primaryColourVal !== null;

    const attributes = hasAttributes
      ? {
          fabric: fabricVal,
          occasion: occasionVal,
          style: styleVal,
          comfort: comfortVal,
          border: borderVal,
          colourPalette: paletteVal,
          primaryColour: primaryColourVal,
        }
      : undefined;

    // Stock count (Zoho uses actual_available_stock or stock_on_hand when tracked)
    let stock = Number(raw.actual_available_stock ?? raw.stock_on_hand ?? raw.initial_stock ?? 0);
    if (isNaN(stock) || stock < 0) {
      stock = 0;
    }
    if (stock === 0 && raw.track_inventory === false && raw.status === "active") {
      stock = 10;
    }

    console.log(`[item-mapper:toDomain] Item "${raw.name}" (${raw.item_id}): rate=${raw.rate}, purchase_rate=${raw.purchase_rate}, track_inventory=${raw.track_inventory}, actual_stock=${raw.actual_available_stock}, stock_on_hand=${raw.stock_on_hand}, initial_stock=${raw.initial_stock} => Domain stock=${stock}`);

    // Category: from custom field, category_name, or inferred from product name
    let categoryRaw = this.getCustomFieldValue(raw, "category") || raw.category_name || null;
    if (!categoryRaw && typeof raw.name === "string") {
      const n = raw.name.toLowerCase();
      if (n.includes("kanchipuram")) categoryRaw = "Kanchipuram Silk Sarees";
      else if (n.includes("banarasi")) categoryRaw = "Banarasi Silk Sarees";
      else if (n.includes("silk cotton")) categoryRaw = "Silk Cotton";
      else if (n.includes("cotton")) categoryRaw = "Cotton Sarees";
      else if (n.includes("organza")) categoryRaw = "Organza Sarees";
      else if (n.includes("linen")) categoryRaw = "Linen Sarees";
    }
    const category = typeof categoryRaw === "string" && categoryRaw.trim() ? categoryRaw.trim() : null;

    const costPrice =
      raw.purchase_rate !== undefined && raw.purchase_rate !== null && !isNaN(Number(raw.purchase_rate))
        ? Money.ofMajor(Number(raw.purchase_rate))
        : null;

    const vendorId = raw.vendor_id ? String(raw.vendor_id) : null;
    const vendorName = raw.vendor_name ? String(raw.vendor_name) : null;

    return createProduct({
      id: raw.item_id,
      sku,
      name: raw.name,
      description: raw.description || "",
      price: Money.ofMajor(raw.rate || 0),
      costPrice,
      vendorId,
      vendorName,
      stock,
      taxId: raw.tax_id ?? null,
      taxPercentage: Number(raw.tax_percentage ?? 0),
      primaryImageUrl,
      category,
      gallery: galleryUrls,
      tags: displayTags,
      offer,
      status: raw.status === "inactive" ? "inactive" : "active",
      attributes,
    });
  }

  static toZohoPayload(props: Partial<ProductProps>, isUpdate = false): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (props.name !== undefined) payload.name = props.name;
    if (props.sku !== undefined && props.sku.trim()) payload.sku = props.sku.trim();
    if (props.description !== undefined) payload.description = props.description;
    if (props.price !== undefined) payload.rate = Money.toMajor(props.price);
    if (props.costPrice !== undefined) {
      payload.purchase_rate = props.costPrice ? Money.toMajor(props.costPrice) : 0;
    }
    if (props.vendorId !== undefined) {
      payload.vendor_id = props.vendorId || "";
    }
    if (props.taxId !== undefined && props.taxId) payload.tax_id = props.taxId;
    if (props.status !== undefined) payload.status = props.status;

    payload.can_be_sold = true;
    payload.can_be_purchased = true;
    payload.account_id = process.env.ZOHO_SALES_ACCOUNT_ID || "4251796000000000486";
    payload.purchase_account_id = process.env.ZOHO_COGS_ACCOUNT_ID || "4251796000000000567";

    // Enable Zoho Inventory tracking (Only valid on POST when creating new items)
    if (!isUpdate) {
      payload.product_type = "goods";
      payload.item_type = "sales_and_purchases";
      payload.track_inventory = true;
      payload.inventory_valuation_method = "fifo";

      const purchaseRateNum =
        props.costPrice !== undefined && props.costPrice !== null
          ? Money.toMajor(props.costPrice)
          : typeof payload.purchase_rate === "number"
          ? payload.purchase_rate
          : 0;
      const salesRateNum =
        typeof payload.rate === "number" && payload.rate > 0
          ? payload.rate
          : props.price !== undefined
          ? Money.toMajor(props.price)
          : 1;
      const initialStockRate = purchaseRateNum > 0 ? purchaseRateNum : salesRateNum > 0 ? salesRateNum : 1;

      if (props.stock !== undefined) {
        payload.initial_stock = props.stock;
        payload.initial_stock_rate = initialStockRate;
      }
      payload.inventory_account_id = process.env.ZOHO_INVENTORY_ACCOUNT_ID || "4251796000000000626";
    }

    // Build custom_fields array only if non-empty custom fields are explicitly present.
    // In Phase 1, unconfigured custom fields cause Zoho API error 57 (not authorized).
    const customFields: Array<{ api_name: string; value: unknown }> = [];

    if (props.gallery && props.gallery.length > 0) {
      customFields.push({
        api_name: "cf_gallery_images",
        value: props.gallery.join("\n"),
      });
    }

    if (props.category !== undefined && props.category !== null && props.category.trim()) {
      customFields.push({
        api_name: "cf_category",
        value: props.category.trim(),
      });
    }

    if (props.tags && props.tags.length > 0) {
      customFields.push({
        api_name: "cf_display_tags",
        value: props.tags.join(", "),
      });
    }

    // Saree Quiz Attributes
    if (props.attributes) {
      if (props.attributes.fabric) {
        customFields.push({
          api_name: "cf_fabric_type",
          value: props.attributes.fabric,
        });
      }
      if (props.attributes.occasion && props.attributes.occasion.length > 0) {
        customFields.push({
          api_name: "cf_occasion",
          value: Array.from(props.attributes.occasion),
        });
      }
      if (props.attributes.style && props.attributes.style.length > 0) {
        customFields.push({
          api_name: "cf_style_preference",
          value: Array.from(props.attributes.style),
        });
      }
      if (props.attributes.comfort && props.attributes.comfort.length > 0) {
        customFields.push({
          api_name: "cf_comfort_feel",
          value: Array.from(props.attributes.comfort),
        });
      }
      if (props.attributes.border) {
        customFields.push({
          api_name: "cf_border_type",
          value: props.attributes.border,
        });
      }
      if (props.attributes.colourPalette) {
        customFields.push({
          api_name: "cf_colour_palette",
          value: props.attributes.colourPalette,
        });
      }
      if (props.attributes.primaryColour) {
        customFields.push({
          api_name: "cf_primary_colour",
          value: props.attributes.primaryColour,
        });
      }
    }

    if (props.offer && props.offer.active) {
      customFields.push(
        { api_name: "cf_offer_active", value: true },
        { api_name: "cf_offer_type", value: props.offer.type },
        {
          api_name: "cf_offer_value",
          value: props.offer.type === "percent" ? props.offer.percent : Money.toMajor(props.offer.amount),
        },
        { api_name: "cf_offer_label", value: props.offer.label },
        { api_name: "cf_offer_expiry", value: props.offer.expiry || "" },
      );
    } else if (isUpdate) {
      customFields.push(
        { api_name: "cf_offer_active", value: false },
        { api_name: "cf_offer_value", value: 0 },
        { api_name: "cf_offer_label", value: "" },
      );
    }

    if (customFields.length > 0) {
      payload.custom_fields = customFields;
    }

    return payload;
  }
}
