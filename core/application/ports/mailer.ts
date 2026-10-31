import type { Quote } from "../../domain/entities/order";

export interface SendOrderConfirmationInput {
  to: string;
  customerName: string;
  invoiceNumber: string;
  invoicePdf: Uint8Array;
  quote: Quote;
  shippingAddress?: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface Mailer {
  sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void>;
}
