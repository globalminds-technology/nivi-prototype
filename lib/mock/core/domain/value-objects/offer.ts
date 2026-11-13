import type { Money } from "./money";

/** Offer applied to a product.
 *  - percent offers: `percent` is required (the % value, e.g. 15)
 *  - flat offers: `amount` is required (Money discount)
 *  Both variants include an optional `expiry` ISO date string.
 */
export type Offer = Readonly<
  | {
      active: boolean;
      type: "percent";
      /** Required for percent offers — e.g. 15 means 15% off */
      percent: number;
      amount?: undefined;
      label: string;
      expiry?: string | null;
    }
  | {
      active: boolean;
      type: "flat";
      percent?: undefined;
      /** Required for flat offers */
      amount: Money;
      label: string;
      expiry?: string | null;
    }
>;
