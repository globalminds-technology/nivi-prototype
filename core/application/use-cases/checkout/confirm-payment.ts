import type { CheckoutSnapshot } from "../../../domain/entities/order";
import { PaymentVerificationError } from "../../../domain/errors/domain-errors";
import type { ConfirmPaymentDto } from "../../dto/checkout.dto";
import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { Mailer } from "../../ports/mailer";
import type { PaymentGateway } from "../../ports/payment-gateway";
import type { SalesRepository } from "../../ports/sales-repository";
import type { TokenSigner } from "../../ports/token-signer";

export interface ConfirmPaymentResult {
  invoiceId: string;
  invoiceNumber: string;
  reviewTokens: Array<{ sku: string; token: string }>;
  isDuplicate: boolean;
}

export class ConfirmPayment {
  constructor(
    private readonly paymentGateway: PaymentGateway,
    private readonly salesRepo: SalesRepository,
    private readonly mailer: Mailer,
    private readonly tokenSigner: TokenSigner,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(dto: ConfirmPaymentDto, snapshot: CheckoutSnapshot): Promise<ConfirmPaymentResult> {
    // 1. Verify Razorpay cryptographic signature
    const isValid = this.paymentGateway.verifyPaymentSignature({
      orderId: dto.razorpayOrderId,
      paymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });

    if (!isValid) {
      throw new PaymentVerificationError("Invalid payment signature received from gateway");
    }

    // 2. Idempotency Check: prevent duplicate Zoho invoice creation on retried callbacks/webhooks
    const existingPayment = await this.salesRepo.findPaymentByReference(dto.razorpayPaymentId);
    if (existingPayment) {
      const reviewTokens = await Promise.all(
        snapshot.quote.lines.map(async (line) => ({
          sku: line.sku,
          token: await this.tokenSigner.signReviewToken({
            invoiceId: existingPayment.invoiceId,
            sku: line.sku,
          }),
        })),
      );

      return {
        invoiceId: existingPayment.invoiceId,
        invoiceNumber: "EXISTING",
        reviewTokens,
        isDuplicate: true,
      };
    }

    // 3. Find or create Zoho Customer Contact
    const { contactId } = await this.salesRepo.findOrCreateContact(snapshot.customer);

    // 4. Create Sales Order in Zoho Books
    if (this.salesRepo.createSalesOrder) {
      try {
        await this.salesRepo.createSalesOrder({
          contactId,
          snapshot,
          referenceNumber: dto.razorpayPaymentId,
        });
      } catch (soErr) {
        console.error("Warning: Failed to record Sales Order in Zoho Books:", soErr);
      }
    }

    // 5. Create Invoice in Zoho Books with server-calculated discounts and rates
    const { invoiceId, invoiceNumber } = await this.salesRepo.createInvoice({
      contactId,
      snapshot,
      referenceNumber: dto.razorpayPaymentId,
    });

    // 6. Record Payment in Zoho Books referencing the Razorpay payment ID
    try {
      await this.salesRepo.recordPayment({
        invoiceId,
        amount: snapshot.quote.total,
        paymentMode: "Razorpay",
        referenceNumber: dto.razorpayPaymentId,
        description: `Payment for Order ${dto.razorpayOrderId}`,
      });
    } catch (paymentErr) {
      console.warn("Could not record payment in Zoho Books (check ZohoBooks.customerpayments OAuth scope):", paymentErr);
    }

    // 6. Fetch native PDF invoice and send Nivi-branded email confirmation
    try {
      const invoicePdf = await this.salesRepo.getInvoicePdf(invoiceId);
      await this.mailer.sendOrderConfirmation({
        to: snapshot.customer.email,
        customerName: snapshot.customer.name,
        invoiceNumber,
        invoicePdf,
        quote: snapshot.quote,
      });
    } catch (err) {
      // Don't fail the order if email sending fails, but log it
      console.error("Failed to send order confirmation email:", err);
    }

    // 7. Invalidate product catalog cache (stock has changed in Zoho)
    await this.cacheInvalidator.revalidateTag("products");

    // 8. Generate signed review tokens for verified buyers
    const reviewTokens = await Promise.all(
      snapshot.quote.lines.map(async (line) => ({
        sku: line.sku,
        token: await this.tokenSigner.signReviewToken({
          invoiceId,
          sku: line.sku,
        }),
      })),
    );

    return {
      invoiceId,
      invoiceNumber,
      reviewTokens,
      isDuplicate: false,
    };
  }
}
