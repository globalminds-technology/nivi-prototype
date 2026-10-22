"use server";

import { container } from "@/infrastructure/di/container";
import {
  CartLineItemDto,
  CheckoutInputDto,
  ConfirmPaymentDto,
} from "@/core/application/dto/checkout.dto";
import type { CheckoutSnapshot, Quote } from "@/core/domain/entities/order";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { matchIndianState, PINCODE_PATTERN } from "@/core/domain/entities/customer";
import { z } from "zod";

export interface QuoteCartResponse {
  success: boolean;
  quote?: Quote;
  error?: string;
  outOfStock?: Array<{ sku: string; requested: number; available: number }>;
}

export async function quoteCartAction(
  items: unknown,
  shippingMethod: "standard" | "express" = "standard",
): Promise<QuoteCartResponse> {
  try {
    const parsed = z.array(CartLineItemDto).min(1).safeParse(items);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const quote = await container.quoteCart().execute(parsed.data, shippingMethod);
    return { success: true, quote };
  } catch (err: unknown) {
    if (err instanceof DomainError && err.code === "OUT_OF_STOCK") {
      const details = (err as unknown as { details?: Array<{ sku: string; requested: number; available: number }> }).details;
      return {
        success: false,
        error: err.message,
        outOfStock: details,
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to calculate order quote",
    };
  }
}

export async function getShippingOptionsAction() {
  try {
    const options = await container.getShippingOptions();
    return { success: true, options: [...options] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load shipping rates",
      options: [],
    };
  }
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  orderId?: string;
  amountMinor?: number;
  currency?: string;
  keyId?: string;
  quote?: Quote;
  snapshot?: CheckoutSnapshot;
  error?: string;
  outOfStock?: Array<{ sku: string; requested: number; available: number }>;
}

export async function createPaymentOrderAction(
  input: unknown,
): Promise<CreatePaymentOrderResponse> {
  try {
    const parsed = CheckoutInputDto.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const result = await container.createPaymentOrder().execute(parsed.data);
    const keyId = container.getRazorpayKeyId() || "rzp_test_mode";

    return {
      success: true,
      orderId: result.order.orderId,
      amountMinor: result.order.amount.minor,
      currency: result.order.currency,
      keyId,
      quote: result.quote,
      snapshot: result.snapshot,
    };
  } catch (err: unknown) {
    if (err instanceof DomainError && err.code === "OUT_OF_STOCK") {
      const details = (err as unknown as { details?: Array<{ sku: string; requested: number; available: number }> }).details;
      return {
        success: false,
        error: err.message,
        outOfStock: details,
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to initiate payment",
    };
  }
}

export interface ConfirmPaymentResponse {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  reviewTokens?: Array<{ sku: string; token: string }>;
  isDuplicate?: boolean;
  error?: string;
}

export async function confirmPaymentAction(
  dto: unknown,
  snapshot: CheckoutSnapshot,
): Promise<ConfirmPaymentResponse> {
  try {
    const parsed = ConfirmPaymentDto.safeParse(dto);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const result = await container.confirmPayment().execute(parsed.data, snapshot);
    return {
      success: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      reviewTokens: result.reviewTokens,
      isDuplicate: result.isDuplicate,
    };
  } catch (err: unknown) {
    console.error("Payment confirmation failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment verification failed",
    };
  }
}

export interface PincodeLookupResult {
  success: boolean;
  city?: string;
  district?: string;
  state?: string;
  places?: string[];
  error?: string;
}

/**
 * Looks up postal details (City/District, State, Localities) using India Post / postal PIN API.
 * Results are cached to provide instant lookups.
 */
export async function lookupPincodeAction(pincode: string): Promise<PincodeLookupResult> {
  const clean = pincode.replace(/\D/g, "").slice(0, 6);
  if (!PINCODE_PATTERN.test(clean)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit Indian PIN code",
    };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: "Postal directory service temporarily unavailable",
      };
    }

    const data = await res.json();
    if (
      Array.isArray(data) &&
      data[0]?.Status === "Success" &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const offices = data[0].PostOffice as Array<{
        District?: string;
        Block?: string;
        Division?: string;
        State?: string;
        Name?: string;
      }>;

      const first = offices[0];
      const city = first.District || first.Block || first.Division || "";
      const rawState = first.State || "";
      const matchedState = matchIndianState(rawState) || rawState;
      const places = Array.from(
        new Set(
          offices
            .map((o) => o.Name?.trim())
            .filter((name): name is string => Boolean(name && name.length > 0)),
        ),
      );

      return {
        success: true,
        city,
        district: city,
        state: matchedState,
        places,
      };
    }

    return {
      success: false,
      error: data[0]?.Message || "No postal records found for this PIN code",
    };
  } catch (err: unknown) {
    console.error("Postal PIN lookup failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to lookup PIN code",
    };
  }
}
