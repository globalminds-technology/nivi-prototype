import "server-only";
import type { Customer } from "@/core/domain/entities/customer";
import type { CheckoutSnapshot } from "@/core/domain/entities/order";
import { calendarDateOf } from "@/core/domain/value-objects/calendar-date";
import { Money } from "@/core/domain/value-objects/money";
import type { SalesRepository } from "@/core/application/ports/sales-repository";
import { ZohoApiError, type ZohoHttpClient } from "./zoho-http";

interface ZohoContactListResponse {
  code: number;
  contacts: Array<{ contact_id: string; contact_name?: string; email?: string; phone?: string; mobile?: string }>;
}

/** Zoho Books error code: "The customer X already exists". */
const ZOHO_DUPLICATE_CONTACT_NAME = 3062;

interface ZohoContactCreateResponse {
  code: number;
  contact: { contact_id: string };
}

interface ZohoInvoiceResponse {
  code: number;
  invoice: {
    invoice_id: string;
    invoice_number: string;
    customer_id: string;
    line_items: Array<{
      item_id: string;
      sku?: string;
      name: string;
    }>;
  };
}

interface ZohoSalesOrderResponse {
  code: number;
  salesorder: {
    salesorder_id: string;
    salesorder_number: string;
    customer_id: string;
  };
}

interface ZohoPaymentListResponse {
  code: number;
  customerpayments: Array<{
    payment_id: string;
    invoice_id?: string;
    reference_number?: string;
    invoices?: Array<{ invoice_id: string }>;
  }>;
}

interface ZohoPaymentCreateResponse {
  code: number;
  payment: { payment_id: string };
}

export class ZohoSalesRepository implements SalesRepository {
  constructor(private readonly http: ZohoHttpClient) {}

  private async findContact(params: Record<string, string>, matches: (c: ZohoContactListResponse["contacts"][number]) => boolean): Promise<string | null> {
    const res = await this.http.get<ZohoContactListResponse>("contacts", params);
    const hit = (res.contacts || []).find(matches);
    return hit ? hit.contact_id : null;
  }

  async findOrCreateContact(customer: Customer): Promise<{ contactId: string }> {
    const email = customer.email.trim().toLowerCase();
    const phone = customer.phone.trim();

    // 1. Look up an existing contact by email, then by phone
    const byEmail = await this.findContact(
      { email_contains: email },
      (c) => (c.email || "").toLowerCase() === email,
    );
    if (byEmail) return { contactId: byEmail };

    const byPhone = await this.findContact(
      { phone_contains: phone },
      (c) => (c.phone || "").endsWith(phone) || (c.mobile || "").endsWith(phone),
    );
    if (byPhone) return { contactId: byPhone };

    // 2. Create a new contact. Zoho requires unique contact names, so if a
    //    different customer already uses this name, retry with a phone suffix.
    try {
      return await this.createContact(customer, customer.name);
    } catch (err) {
      if (err instanceof ZohoApiError && err.code === ZOHO_DUPLICATE_CONTACT_NAME) {
        return this.createContact(customer, `${customer.name} (${phone})`);
      }
      throw err;
    }
  }

  private async createContact(customer: Customer, contactName: string): Promise<{ contactId: string }> {
    const payload: Record<string, unknown> = {
      contact_name: contactName,
      company_name: customer.name,
      contact_type: "customer",
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone,
      contact_persons: [
        {
          first_name: customer.name,
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone,
          mobile: customer.phone,
          is_primary_contact: true,
        },
      ],
      billing_address: {
        address: customer.billingAddress.line1,
        street2: customer.billingAddress.line2 || "",
        city: customer.billingAddress.city,
        state: customer.billingAddress.state,
        zip: customer.billingAddress.pincode,
        country: customer.billingAddress.country || "India",
      },
      shipping_address: {
        address: customer.shippingAddress.line1,
        street2: customer.shippingAddress.line2 || "",
        city: customer.shippingAddress.city,
        state: customer.shippingAddress.state,
        zip: customer.shippingAddress.pincode,
        country: customer.shippingAddress.country || "India",
      },
    };

    // Only send GST fields if the customer explicitly provided a business GSTIN.
    // For non-GST organizations in Zoho Books, sending gst_treatment returns "Invalid Element gst_treatment".
    if (customer.gstin && customer.gstin.trim()) {
      payload.gst_no = customer.gstin.trim();
      payload.gst_treatment = "business_gst";
    }

    try {
      const createRes = await this.http.post<ZohoContactCreateResponse>("contacts", payload);
      return { contactId: createRes.contact.contact_id };
    } catch (err) {
      // If Zoho organization has GST disabled and errors on gst_treatment or gst_no, strip them and retry
      if (
        err instanceof ZohoApiError &&
        (err.message.includes("gst_treatment") || err.message.includes("gst_no"))
      ) {
        delete payload.gst_no;
        delete payload.gst_treatment;
        const retryRes = await this.http.post<ZohoContactCreateResponse>("contacts", payload);
        return { contactId: retryRes.contact.contact_id };
      }
      throw err;
    }
  }

  async createInvoice(input: {
    contactId: string;
    snapshot: CheckoutSnapshot;
    referenceNumber: string;
  }): Promise<{ invoiceId: string; invoiceNumber: string }> {
    const today = calendarDateOf(new Date());

    const lineItems = input.snapshot.quote.lines.map((line) => {
      const discountMajor = Money.toMajor(line.unitDiscount) * line.quantity;
      return {
        item_id: line.productId || undefined,
        name: line.name,
        description: line.offerLabel ? `Includes offer: ${line.offerLabel}` : undefined,
        rate: Money.toMajor(line.unitPrice),
        quantity: line.quantity,
        discount: discountMajor > 0 ? discountMajor : 0,
        tax_id: line.taxId || undefined,
      };
    });

    const shippingMajor = input.snapshot.quote.shipping
      ? Money.toMajor(input.snapshot.quote.shipping)
      : 0;

    const payload: Record<string, unknown> = {
      customer_id: input.contactId,
      date: today,
      reference_number: input.referenceNumber,
      is_inclusive_tax: input.snapshot.quote.taxInclusive,
      shipping_charge: shippingMajor > 0 ? shippingMajor : undefined,
      line_items: lineItems,
      notes: "Thank you for shopping with Nivi!",
    };

    try {
      const res = await this.http.post<ZohoInvoiceResponse>("invoices", payload);
      return {
        invoiceId: res.invoice.invoice_id,
        invoiceNumber: res.invoice.invoice_number,
      };
    } catch (err) {
      if (err instanceof ZohoApiError && (err.message.includes("is_inclusive_tax") || err.message.includes("tax"))) {
        delete payload.is_inclusive_tax;
        const retryRes = await this.http.post<ZohoInvoiceResponse>("invoices", payload);
        return {
          invoiceId: retryRes.invoice.invoice_id,
          invoiceNumber: retryRes.invoice.invoice_number,
        };
      }
      throw err;
    }
  }

  async createSalesOrder(input: {
    contactId: string;
    snapshot: CheckoutSnapshot;
    referenceNumber: string;
  }): Promise<{ salesOrderId: string; salesOrderNumber: string }> {
    const today = calendarDateOf(new Date());

    const lineItems = input.snapshot.quote.lines.map((line) => {
      const discountMajor = Money.toMajor(line.unitDiscount) * line.quantity;
      return {
        item_id: line.productId || undefined,
        name: line.name,
        description: line.offerLabel ? `Includes offer: ${line.offerLabel}` : undefined,
        rate: Money.toMajor(line.unitPrice),
        quantity: line.quantity,
        discount: discountMajor > 0 ? discountMajor : 0,
        tax_id: line.taxId || undefined,
      };
    });

    const ship = input.snapshot.customer.shippingAddress;
    const deliveryAddress = [ship.line1, ship.line2, ship.city, ship.state, ship.pincode, ship.country || "India"]
      .filter(Boolean)
      .join(", ");

    const shippingMajor = input.snapshot.quote.shipping
      ? Money.toMajor(input.snapshot.quote.shipping)
      : 0;
    const shippingMethodLabel =
      input.snapshot.quote.shippingLabel ||
      (input.snapshot.quote.shippingMethod === "express" ? "Express Delivery" : "Standard Shipping");

    const payload: Record<string, unknown> = {
      customer_id: input.contactId,
      date: today,
      reference_number: input.referenceNumber,
      is_inclusive_tax: input.snapshot.quote.taxInclusive,
      shipping_charge: shippingMajor > 0 ? shippingMajor : undefined,
      line_items: lineItems,
      notes: [
        "Order placed via NiVi Storefront.",
        `Payment Ref: ${input.referenceNumber}`,
        `Shipping: ${shippingMethodLabel} (${shippingMajor > 0 ? `₹${shippingMajor}` : "Free"})`,
        `Deliver to: ${input.snapshot.customer.name}, ${input.snapshot.customer.phone}`,
        deliveryAddress,
      ].join("\n"),
    };

    let res: ZohoSalesOrderResponse;
    try {
      res = await this.http.post<ZohoSalesOrderResponse>("salesorders", payload);
    } catch (err) {
      if (err instanceof ZohoApiError && (err.message.includes("is_inclusive_tax") || err.message.includes("tax"))) {
        delete payload.is_inclusive_tax;
        res = await this.http.post<ZohoSalesOrderResponse>("salesorders", payload);
      } else {
        throw err;
      }
    }
    const salesOrderId = res.salesorder.salesorder_id;

    // Payment is already verified, so move the order out of draft.
    try {
      await this.http.post(`salesorders/${salesOrderId}/status/confirmed`);
    } catch (err) {
      console.error(`Sales order ${salesOrderId} created but could not be confirmed:`, err);
    }

    return {
      salesOrderId,
      salesOrderNumber: res.salesorder.salesorder_number,
    };
  }

  async recordPayment(input: {
    invoiceId: string;
    amount: Money;
    paymentMode: string;
    referenceNumber: string;
    description: string;
  }): Promise<{ paymentId: string }> {
    // Look up invoice to get customer_id
    const invoiceRes = await this.http.get<ZohoInvoiceResponse>(`invoices/${input.invoiceId}`);
    const customerId = invoiceRes.invoice.customer_id;
    const today = calendarDateOf(new Date());

    const payload = {
      customer_id: customerId,
      payment_mode: input.paymentMode,
      amount: Money.toMajor(input.amount),
      date: today,
      reference_number: input.referenceNumber,
      description: input.description,
      invoices: [
        {
          invoice_id: input.invoiceId,
          amount_applied: Money.toMajor(input.amount),
        },
      ],
    };

    const res = await this.http.post<ZohoPaymentCreateResponse>("customerpayments", payload);
    return { paymentId: res.payment.payment_id };
  }

  async findPaymentByReference(referenceNumber: string): Promise<{ paymentId: string; invoiceId: string } | null> {
    try {
      const res = await this.http.get<ZohoPaymentListResponse>("customerpayments", {
        reference_number: referenceNumber,
      });

      const payment = (res.customerpayments || []).find((p) => p.reference_number === referenceNumber);
      if (payment) {
        const invoiceId = payment.invoice_id || (payment.invoices && payment.invoices[0]?.invoice_id) || "";
        return {
          paymentId: payment.payment_id,
          invoiceId,
        };
      }
    } catch {
      // If customerpayments is not authorized, check invoices by reference_number
    }

    try {
      const invRes = await this.http.get<{ invoices: Array<{ invoice_id: string; reference_number?: string }> }>(
        "invoices",
        { reference_number: referenceNumber },
      );
      const match = (invRes.invoices || []).find((i) => i.reference_number === referenceNumber);
      if (match) {
        return {
          paymentId: referenceNumber,
          invoiceId: match.invoice_id,
        };
      }
    } catch {
      // Fallback failed
    }

    return null;
  }

  async getInvoicePdf(invoiceId: string): Promise<Uint8Array> {
    return this.http.getBinary(`invoices/${invoiceId}`, { accept: "pdf" });
  }

  async verifyInvoiceItem(invoiceId: string, sku: string): Promise<boolean> {
    try {
      const res = await this.http.get<ZohoInvoiceResponse>(`invoices/${invoiceId}`);
      if (!res.invoice || !res.invoice.line_items) return false;

      const skuLower = sku.toLowerCase();
      return res.invoice.line_items.some(
        (li) => (li.sku && li.sku.toLowerCase() === skuLower) || li.name.toLowerCase().includes(skuLower),
      );
    } catch {
      return false;
    }
  }
}
