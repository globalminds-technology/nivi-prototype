import type { Customer } from "../../core/domain/entities/customer";
import { createProduct, type Product, type ProductProps } from "../../core/domain/entities/product";
import type { CheckoutSnapshot } from "../../core/domain/entities/order";
import type { Review } from "../../core/domain/entities/review";
import type { Money } from "../../core/domain/value-objects/money";
import type { Sku } from "../../core/domain/value-objects/sku";
import type { CacheInvalidator } from "../../core/application/ports/cache-invalidator";
import type { Clock } from "../../core/application/ports/clock";
import type { Mailer, SendOrderConfirmationInput } from "../../core/application/ports/mailer";
import type { CreateOrderInput, PaymentGateway, PaymentOrder } from "../../core/application/ports/payment-gateway";
import type { ProductFilter, ProductRepository } from "../../core/application/ports/product-repository";
import type { ReviewRepository } from "../../core/application/ports/review-repository";
import type { SalesRepository } from "../../core/application/ports/sales-repository";
import type { ReviewTokenPayload, TokenSigner } from "../../core/application/ports/token-signer";

export class InMemoryProductRepository implements ProductRepository {
  public products: Product[] = [];

  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    let result = [...this.products];
    if (filter?.status) {
      result = result.filter((p) => p.status === filter.status);
    }
    if (filter?.tag) {
      result = result.filter((p) => p.tags.includes(filter.tag!));
    }
    if (filter?.hasOffer !== undefined) {
      result = result.filter((p) => (p.offer !== null) === filter.hasOffer);
    }
    return result;
  }

  async getBySku(sku: Sku): Promise<Product | null> {
    return this.products.find((p) => p.sku === sku) ?? null;
  }

  async getById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async create(props: ProductProps): Promise<Product> {
    const product = createProduct({
      ...props,
      id: props.id || `zoho_item_${this.products.length + 1}`,
    });
    this.products.push(product);
    return product;
  }

  async update(id: string, updates: Partial<ProductProps>): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found");
    const current = this.products[index];
    const updated = createProduct({
      ...current,
      ...updates,
      id: current.id,
      sku: current.sku,
    });
    this.products[index] = updated;
    return updated;
  }
}

export class InMemorySalesRepository implements SalesRepository {
  public contacts = new Map<string, string>(); // email -> contactId
  public invoices: Array<{ invoiceId: string; invoiceNumber: string; snapshot: CheckoutSnapshot; ref: string }> = [];
  public payments: Array<{ paymentId: string; invoiceId: string; ref: string; amount: Money }> = [];
  public validInvoiceItems = new Set<string>(); // "invoiceId:sku"

  async findOrCreateContact(customer: Customer): Promise<{ contactId: string }> {
    let contactId = this.contacts.get(customer.email);
    if (!contactId) {
      contactId = `contact_${this.contacts.size + 1}`;
      this.contacts.set(customer.email, contactId);
    }
    return { contactId };
  }

  async createInvoice(input: { contactId: string; snapshot: CheckoutSnapshot; referenceNumber: string }): Promise<{ invoiceId: string; invoiceNumber: string }> {
    const invoiceId = `inv_${this.invoices.length + 1}`;
    const invoiceNumber = `INV-2026-00${this.invoices.length + 1}`;
    this.invoices.push({ invoiceId, invoiceNumber, snapshot: input.snapshot, ref: input.referenceNumber });
    for (const line of input.snapshot.quote.lines) {
      this.validInvoiceItems.add(`${invoiceId}:${line.sku}`);
    }
    return { invoiceId, invoiceNumber };
  }

  async recordPayment(input: { invoiceId: string; amount: Money; paymentMode: string; referenceNumber: string; description: string }): Promise<{ paymentId: string }> {
    const paymentId = `pay_${this.payments.length + 1}`;
    this.payments.push({ paymentId, invoiceId: input.invoiceId, ref: input.referenceNumber, amount: input.amount });
    return { paymentId };
  }

  async findPaymentByReference(referenceNumber: string): Promise<{ paymentId: string; invoiceId: string } | null> {
    const found = this.payments.find((p) => p.ref === referenceNumber);
    return found ? { paymentId: found.paymentId, invoiceId: found.invoiceId } : null;
  }

  async getInvoicePdf(): Promise<Uint8Array> {
    return new Uint8Array([37, 80, 68, 70]); // %PDF mock bytes
  }

  async verifyInvoiceItem(invoiceId: string, sku: string): Promise<boolean> {
    return this.validInvoiceItems.has(`${invoiceId}:${sku}`);
  }
}

export class InMemoryPaymentGateway implements PaymentGateway {
  public orders: PaymentOrder[] = [];
  public shouldSignaturePass = true;

  async createOrder(input: CreateOrderInput): Promise<PaymentOrder> {
    const order: PaymentOrder = {
      orderId: `order_rzp_${this.orders.length + 1}`,
      amount: input.amount,
      currency: "INR",
    };
    this.orders.push(order);
    return order;
  }

  verifyPaymentSignature(): boolean {
    return this.shouldSignaturePass;
  }

  verifyWebhookSignature(): boolean {
    return this.shouldSignaturePass;
  }
}

export class InMemoryMailer implements Mailer {
  public sentEmails: SendOrderConfirmationInput[] = [];

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    this.sentEmails.push(input);
  }
}

export class InMemoryReviewRepository implements ReviewRepository {
  public reviews: Review[] = [];

  async listBySku(sku: Sku, includeHidden = false): Promise < readonly Review[] > {
      return this.reviews.filter((r) => r.sku === sku && (includeHidden || !r.hidden));
    }

  async listAll(): Promise < readonly Review[] > {
      return [...this.reviews];
    }

  async findByInvoiceAndSku(invoiceId: string, sku: Sku): Promise < Review | null > {
      return this.reviews.find((r) => r.invoiceId === invoiceId && r.sku === sku) ?? null;
    }

  async create(review: Review): Promise < void> {
      this.reviews.push({ ...review, hidden: review.hidden ?? false });
    }

  async toggleVisibility(reviewId: string, sku: Sku, hidden: boolean): Promise < void> {
      const rev = this.reviews.find((r) => r.id === reviewId && r.sku === sku);
      if(rev) {
        (rev as any).hidden = hidden;
      }
    }
  }

export class FakeTokenSigner implements TokenSigner {
  async signReviewToken(payload: ReviewTokenPayload): Promise<string> {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
  }

  async verifyReviewToken(token: string): Promise<ReviewTokenPayload | null> {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

export class FakeCacheInvalidator implements CacheInvalidator {
  public invalidatedTags: string[] = [];
  public invalidatedPaths: string[] = [];

  async revalidateTag(tag: string): Promise<void> {
    this.invalidatedTags.push(tag);
  }

  async revalidatePath(path: string): Promise<void> {
    this.invalidatedPaths.push(path);
  }
}

export class FixedClock implements Clock {
  constructor(public currentDate: Date = new Date("2026-10-03T10:00:00.000Z")) { }
  now(): Date {
    return this.currentDate;
  }
}
