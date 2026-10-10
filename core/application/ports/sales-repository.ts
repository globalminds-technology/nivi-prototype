import type { Customer } from "../../domain/entities/customer";
import type { CheckoutSnapshot } from "../../domain/entities/order";
import type { Money } from "../../domain/value-objects/money";

export interface SalesRepository {
  findOrCreateContact(customer: Customer): Promise<{ contactId: string }>;
  createInvoice(input: {
    contactId: string;
    snapshot: CheckoutSnapshot;
    referenceNumber: string;
  }): Promise<{ invoiceId: string; invoiceNumber: string }>;
  createSalesOrder?(input: {
    contactId: string;
    snapshot: CheckoutSnapshot;
    referenceNumber: string;
  }): Promise<{ salesOrderId: string; salesOrderNumber: string }>;
  recordPayment(input: {
    invoiceId: string;
    amount: Money;
    paymentMode: string;
    referenceNumber: string;
    description: string;
  }): Promise<{ paymentId: string }>;
  findPaymentByReference(referenceNumber: string): Promise<{ paymentId: string; invoiceId: string } | null>;
  getInvoicePdf(invoiceId: string): Promise<Uint8Array>;
  verifyInvoiceItem(invoiceId: string, sku: string): Promise<boolean>;
}
