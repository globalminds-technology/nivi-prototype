import { beforeEach, describe, expect, it } from "vitest";
import { ConfirmPayment } from "../../core/application/use-cases/checkout/confirm-payment";
import { CreatePaymentOrder } from "../../core/application/use-cases/checkout/create-payment-order";
import { QuoteCart } from "../../core/application/use-cases/checkout/quote-cart";
import { CreateProduct } from "../../core/application/use-cases/products/create-product";
import { OutOfStockError, PaymentVerificationError } from "../../core/domain/errors/domain-errors";
import {
  FakeCacheInvalidator,
  FakeTokenSigner,
  FixedClock,
  InMemoryMailer,
  InMemoryPaymentGateway,
  InMemoryProductRepository,
  InMemorySalesRepository,
} from "../fakes/in-memory-repositories";

describe("Checkout Use Cases", () => {
  let productRepo: InMemoryProductRepository;
  let salesRepo: InMemorySalesRepository;
  let paymentGateway: InMemoryPaymentGateway;
  let mailer: InMemoryMailer;
  let tokenSigner: FakeTokenSigner;
  let cacheInvalidator: FakeCacheInvalidator;
  let clock: FixedClock;

  const validCustomer = {
    name: "Aadhavan Kumar",
    email: "aadhavan@example.com",
    phone: "9876543210",
    shippingAddress: {
      line1: "123 Anna Salai",
      line2: null,
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
      country: "India",
    },
    billingAddress: {
      line1: "123 Anna Salai",
      line2: null,
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
      country: "India",
    },
    gstin: null,
  };

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository();
    salesRepo = new InMemorySalesRepository();
    paymentGateway = new InMemoryPaymentGateway();
    mailer = new InMemoryMailer();
    tokenSigner = new FakeTokenSigner();
    cacheInvalidator = new FakeCacheInvalidator();
    clock = new FixedClock(new Date("2026-10-03T10:00:00.000Z"));

    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);

    await createProductUseCase.execute({
      sku: "SILK-01",
      name: "Mysore Silk",
      description: "",
      price: 5000,
      stock: 3,
      taxPercentage: 5,
      gallery: [],
      tags: [],
      offer: {
        active: true,
        type: "percent",
        value: 10,
        label: "10% Off",
        expiry: "2026-10-10",
      },
      status: "active",
    });
  });

  it("quotes cart and enforces server-side stock checks", async () => {
    const quoteCartUseCase = new QuoteCart(productRepo, clock);

    // 2 units of ₹5,000 item with 10% discount = ₹4,500 * 2 = ₹9,000
    const quote = await quoteCartUseCase.execute([{ sku: "SILK-01", quantity: 2 }]);
    expect(quote.total.minor).toBe(900000);
    expect(quote.discount.minor).toBe(100000);

    // Requesting 5 units when only 3 are in stock throws OutOfStockError
    await expect(quoteCartUseCase.execute([{ sku: "SILK-01", quantity: 5 }])).rejects.toThrow(OutOfStockError);
  });

  it("creates payment order with exact server amount and snapshot", async () => {
    const quoteCartUseCase = new QuoteCart(productRepo, clock);
    const createOrderUseCase = new CreatePaymentOrder(quoteCartUseCase, paymentGateway);

    const result = await createOrderUseCase.execute({
      customer: validCustomer,
      items: [{ sku: "SILK-01", quantity: 1 }],
    });

    // 1 item = ₹5,000 - 10% = ₹4,500 (450,000 paise)
    expect(result.order.amount.minor).toBe(450000);
    expect(result.quote.total.minor).toBe(450000);
    expect(result.snapshot.customer.email).toBe("aadhavan@example.com");
  });

  it("confirms payment, creates Zoho invoice and prevents duplicate invoices", async () => {
    const quoteCartUseCase = new QuoteCart(productRepo, clock);
    const createOrderUseCase = new CreatePaymentOrder(quoteCartUseCase, paymentGateway);
    const confirmPaymentUseCase = new ConfirmPayment(
      paymentGateway,
      salesRepo,
      mailer,
      tokenSigner,
      cacheInvalidator,
    );

    const { snapshot } = await createOrderUseCase.execute({
      customer: validCustomer,
      items: [{ sku: "SILK-01", quantity: 1 }],
    });

    const paymentDto = {
      razorpayOrderId: "order_rzp_1",
      razorpayPaymentId: "pay_rzp_test_123",
      razorpaySignature: "valid_signature_hash",
    };

    // First confirmation: success, creates invoice
    const result1 = await confirmPaymentUseCase.execute(paymentDto, snapshot);
    expect(result1.isDuplicate).toBe(false);
    expect(result1.invoiceNumber).toContain("INV-");
    expect(result1.reviewTokens.length).toBe(1);
    expect(result1.reviewTokens[0].sku).toBe("SILK-01");
    expect(mailer.sentEmails.length).toBe(1);
    expect(salesRepo.invoices.length).toBe(1);

    // Second confirmation with same payment ID (idempotency check): returns existing, creates NO new invoice
    const result2 = await confirmPaymentUseCase.execute(paymentDto, snapshot);
    expect(result2.isDuplicate).toBe(true);
    expect(result2.invoiceId).toBe(result1.invoiceId);
    expect(salesRepo.invoices.length).toBe(1); // Still 1!
  });

  it("rejects confirmation when gateway signature verification fails", async () => {
    const quoteCartUseCase = new QuoteCart(productRepo, clock);
    const createOrderUseCase = new CreatePaymentOrder(quoteCartUseCase, paymentGateway);
    const confirmPaymentUseCase = new ConfirmPayment(
      paymentGateway,
      salesRepo,
      mailer,
      tokenSigner,
      cacheInvalidator,
    );

    const { snapshot } = await createOrderUseCase.execute({
      customer: validCustomer,
      items: [{ sku: "SILK-01", quantity: 1 }],
    });

    paymentGateway.shouldSignaturePass = false;

    await expect(
      confirmPaymentUseCase.execute(
        {
          razorpayOrderId: "order_rzp_1",
          razorpayPaymentId: "pay_rzp_tampered",
          razorpaySignature: "invalid_sig",
        },
        snapshot,
      ),
    ).rejects.toThrow(PaymentVerificationError);
  });
});
