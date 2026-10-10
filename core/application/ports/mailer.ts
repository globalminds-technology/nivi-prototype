import type { Quote } from "../../domain/entities/order";

export interface SendOrderConfirmationInput {
  to: string;
  customerName: string;
  invoiceNumber: string;
  invoicePdf: Uint8Array;
  quote: Quote;
}

export interface Mailer {
  sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void>;
}
