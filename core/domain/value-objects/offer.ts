import { ValidationError } from "../errors/domain-errors";
import { type CalendarDate, isBefore } from "./calendar-date";
import { Money } from "./money";

export type OfferType = "percent" | "flat";

type OfferBase = Readonly<{
  active: boolean;
  /** Display label, e.g. "Diwali Offer". */
  label: string;
  /** Last day the offer is valid (inclusive). `null` = no expiry. */
  expiry: CalendarDate | null;
}>;

export type Offer = OfferBase &
  (Readonly<{ type: "percent"; percent: number }> | Readonly<{ type: "flat"; amount: Money }>);

export type OfferInput =
  | (OfferBase & { type: "percent"; percent: number })
  | (OfferBase & { type: "flat"; amount: Money });

export function createOffer(input: OfferInput): Offer {
  const label = input.label.trim();
  if (input.type === "percent") {
    if (!(input.percent > 0 && input.percent <= 100)) {
      throw new ValidationError("Percent offer must be greater than 0 and at most 100", { percent: input.percent });
    }
    return Object.freeze({ active: input.active, label, expiry: input.expiry, type: "percent", percent: input.percent });
  }
  if (input.amount.minor <= 0) {
    throw new ValidationError("Flat offer amount must be greater than 0");
  }
  return Object.freeze({ active: input.active, label, expiry: input.expiry, type: "flat", amount: input.amount });
}

/** Expired = the expiry day has fully passed. The offer is still valid ON its expiry date. */
export function isOfferExpired(offer: Offer, today: CalendarDate): boolean {
  return offer.expiry !== null && isBefore(offer.expiry, today);
}

/**
 * Live = switched on AND not expired. Pricing uses this rather than the raw
 * `active` flag, so prices are correct even before the expiry cron runs.
 */
export function isOfferLive(offer: Offer | null, today: CalendarDate): offer is Offer {
  return offer !== null && offer.active && !isOfferExpired(offer, today);
}

/** Per-unit discount; never exceeds the unit price. */
export function offerDiscount(offer: Offer, unitPrice: Money): Money {
  const raw =
    offer.type === "percent" ? Money.multiply(unitPrice, offer.percent / 100) : offer.amount;
  return Money.min(Money.clampToZero(raw), unitPrice);
}
