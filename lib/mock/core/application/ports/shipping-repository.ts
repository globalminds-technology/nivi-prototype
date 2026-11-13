import type { Money } from "../../domain/value-objects/money";

export interface ShippingOption {
  id: string;
  name: string;
  /** "standard" | "express" | "flat" etc. */
  type: string;
  /** Money object for the shipping rate */
  rate: Money;
  /** Convenience field: rate in paise/minor units */
  rateMinor: number;
  estimatedDays: string;
}
