export interface ShippingOption {
  id: string; // Zoho item_id
  sku: "SHIP-STD" | "SHIP-EXP" | string;
  type: "standard" | "express";
  name: string; // e.g. "Standard Shipping", "Express Delivery"
  rate: number; // in Rupees
  rateMinor: number; // in Paise
}

export interface ShippingRepository {
  getShippingOptions(): Promise<readonly ShippingOption[]>;
  getOptionByType(type: "standard" | "express"): Promise<ShippingOption>;
  updateRates(rates: { standardRate?: number; expressRate?: number }): Promise<readonly ShippingOption[]>;
}
