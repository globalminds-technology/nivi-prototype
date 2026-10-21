import type { CheckoutSnapshot, Quote } from "../../../domain/entities/order";
import type { CheckoutInputDto } from "../../dto/checkout.dto";
import type { PaymentGateway, PaymentOrder } from "../../ports/payment-gateway";
import { QuoteCart } from "./quote-cart";

export interface CreatePaymentOrderResult {
  order: PaymentOrder;
  quote: Quote;
  snapshot: CheckoutSnapshot;
}

export class CreatePaymentOrder {
  constructor(
    private readonly quoteCart: QuoteCart,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(dto: CheckoutInputDto): Promise<CreatePaymentOrderResult> {
    const quote = await this.quoteCart.execute(dto.items, dto.shippingMethod || "standard");

    const snapshot: CheckoutSnapshot = {
      quote,
      customer: {
        name: dto.customer.name,
        email: dto.customer.email,
        phone: dto.customer.phone,
        shippingAddress: {
          ...dto.customer.shippingAddress,
          line2: dto.customer.shippingAddress.line2 ?? null,
        },
        billingAddress: {
          ...dto.customer.billingAddress,
          line2: dto.customer.billingAddress.line2 ?? null,
        },
        gstin: dto.customer.gstin || null,
      },
    };

    const receipt = `rcpt_${Date.now().toString(36)}`;

    // Create payment order with exact server-calculated amount
    const order = await this.paymentGateway.createOrder({
      amount: quote.total,
      receipt,
      notes: {
        customerEmail: dto.customer.email,
        customerPhone: dto.customer.phone,
        itemCount: String(dto.items.length),
        shippingMethod: dto.shippingMethod || "standard",
      },
    });

    return { order, quote, snapshot };
  }
}
