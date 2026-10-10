import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/di/container";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    const webhookSecret = container.getRazorpayWebhookSecret();

    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET not configured, skipping webhook processing.");
      return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 500 });
    }

    const isValid = container.paymentGateway().verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const paymentId = paymentEntity?.id;

      if (paymentId) {
        // Idempotency check: see if payment was already recorded by the client's inline flow
        const existing = await container.salesRepository().findPaymentByReference(paymentId);
        if (existing) {
          return NextResponse.json({ ok: true, status: "already_processed" });
        }
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (err: unknown) {
    console.error("Razorpay webhook processing error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 },
    );
  }
}
