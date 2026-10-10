import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import type {
  CreateOrderInput,
  PaymentGateway,
  PaymentOrder,
  VerifySignatureInput,
} from "@/core/application/ports/payment-gateway";
import { env } from "@/infrastructure/config/env";

export class RazorpayPaymentGateway implements PaymentGateway {
  private client: Razorpay | null = null;
  private keyId: string | null = null;
  private keySecret: string | null = null;

  private init(): boolean {
    if (this.client) return true;
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = env();

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return false;
    }

    this.keyId = RAZORPAY_KEY_ID;
    this.keySecret = RAZORPAY_KEY_SECRET;
    this.client = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    return true;
  }

  async createOrder(input: CreateOrderInput): Promise<PaymentOrder> {
    const isConfigured = this.init();
    if (!isConfigured || !this.client) {
      // Test / Direct Order Mode when Razorpay keys are not yet configured in .env
      return {
        orderId: `order_test_${Date.now()}`,
        amount: input.amount,
        currency: input.amount.currency,
      };
    }

    const order = await this.client.orders.create({
      amount: input.amount.minor,
      currency: input.amount.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      orderId: order.id,
      amount: input.amount,
      currency: order.currency,
    };
  }

  verifyPaymentSignature(input: VerifySignatureInput): boolean {
    const isConfigured = this.init();
    if (!isConfigured || !this.keySecret) {
      // In Direct/Test Mode, verify test signatures
      return (
        input.orderId.startsWith("order_test_") ||
        input.paymentId.startsWith("pay_test_") ||
        input.paymentId.startsWith("pay_direct_")
      );
    }

    const body = `${input.orderId}|${input.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(input.signature, "utf-8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(signature, "utf-8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
