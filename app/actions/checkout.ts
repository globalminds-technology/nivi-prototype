"use server";

import { container } from "@/infrastructure/di/container";
import {
  CartLineItemDto,
  CheckoutInputDto,
  ConfirmPaymentDto,
} from "@/core/application/dto/checkout.dto";
import type { CheckoutSnapshot, Quote } from "@/core/domain/entities/order";
import { DomainError } from "@/core/domain/errors/domain-errors";
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
