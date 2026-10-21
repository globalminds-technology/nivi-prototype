import { z } from "zod";
import { GSTIN_PATTERN, INDIAN_MOBILE_PATTERN, PINCODE_PATTERN } from "../../domain/entities/customer";
import { SKU_PATTERN } from "../../domain/value-objects/sku";

export const AddressDto = z.object({
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(PINCODE_PATTERN, "Enter a valid 6-digit Indian PIN code"),
  country: z.string().default("India"),
});

export const CustomerDto = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(INDIAN_MOBILE_PATTERN, "Enter a valid 10-digit Indian mobile number")
    .transform((val) => {
      const match = INDIAN_MOBILE_PATTERN.exec(val.replace(/[\s-]/g, ""));
      return match ? match[1] : val;
    }),
  shippingAddress: AddressDto,
  billingAddress: AddressDto,
  gstin: z
    .string()
    .regex(GSTIN_PATTERN, "Enter a valid 15-character GSTIN")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const CartLineItemDto = z.object({
  sku: z.string().regex(SKU_PATTERN),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Maximum 10 units per item"),
});

export const CheckoutInputDto = z.object({
  customer: CustomerDto,
  items: z.array(CartLineItemDto).min(1, "Cart cannot be empty"),
  shippingMethod: z.enum(["standard", "express"]).optional(),
});

export const ConfirmPaymentDto = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type AddressDto = z.infer<typeof AddressDto>;
export type CustomerDto = z.infer<typeof CustomerDto>;
export type CartLineItemDto = z.infer<typeof CartLineItemDto>;
export type CheckoutInputDto = z.infer<typeof CheckoutInputDto>;
export type ConfirmPaymentDto = z.infer<typeof ConfirmPaymentDto>;
