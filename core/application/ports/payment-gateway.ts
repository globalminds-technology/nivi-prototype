import type { Money } from "../../domain/value-objects/money";

export interface CreateOrderInput {
  amount: Money;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentOrder {
  orderId: string;
  amount: Money;
  currency: string;
}

export interface VerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGateway {
  createOrder(input: CreateOrderInput): Promise<PaymentOrder>;
  verifyPaymentSignature(input: VerifySignatureInput): boolean;
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean;
}
