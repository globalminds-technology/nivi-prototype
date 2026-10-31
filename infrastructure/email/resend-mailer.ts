import "server-only";
import { Resend } from "resend";
import type { Mailer, SendOrderConfirmationInput } from "@/core/application/ports/mailer";
import { env, requireEnv } from "@/infrastructure/config/env";
import { Money } from "@/core/domain/value-objects/money";

export class ResendMailer implements Mailer {
  private client: Resend | null = null;

  private init() {
    if (!this.client) {
      const { RESEND_API_KEY } = requireEnv("RESEND_API_KEY");
      this.client = new Resend(RESEND_API_KEY);
    }
  }

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    this.init();
    const from = env().MAIL_FROM || "Nivi Sarees <orders@nivi.in>";

    const formatInr = (m: Money) =>
      `₹${Money.toMajor(m).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const linesHtml = input.quote.lines
      .map(
        (line) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0e6e6;">${line.name} × ${line.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0e6e6; text-align: right;">${formatInr(line.lineTotal)}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <div style="font-family: serif; color: #2a2323; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #800020; font-size: 28px; margin: 0; letter-spacing: 0.1em;">N I V I</h1>
          <p style="color: #b8860b; font-size: 13px; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.2em;">Heritage Silk &amp; Festive Elegance</p>
        </div>
        <div style="background: #fffdfc; border: 1px solid #f0e6e6; border-radius: 8px; padding: 24px;">
          <h2 style="font-size: 20px; color: #800020; margin-top: 0;">Order Confirmed</h2>
          <p>Dear ${input.customerName},</p>
          <p>Thank you for choosing Nivi. We have received your order and are preparing it with the utmost care.</p>
          <p><strong>Invoice Number:</strong> ${input.invoiceNumber}</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: sans-serif; font-size: 14px;">
            <thead>
              <tr style="background: #fbf8f7; color: #735c5c; text-align: left;">
                <th style="padding: 12px;">Item</th>
                <th style="padding: 12px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${linesHtml}

              <!-- Subtotal -->
              <tr style="border-top: 1px solid #f0e6e6; color: #555;">
                <td style="padding: 10px 12px;">Subtotal</td>
                <td style="padding: 10px 12px; text-align: right; font-family: monospace;">${formatInr(input.quote.subtotal)}</td>
              </tr>

              <!-- Festive Discount (if any) -->
              ${
                input.quote.discount && input.quote.discount.minor > 0
                  ? `
              <tr style="color: #047857;">
                <td style="padding: 8px 12px;">Festive Discount</td>
                <td style="padding: 8px 12px; text-align: right; font-family: monospace;">-${formatInr(input.quote.discount)}</td>
              </tr>`
                  : ""
              }

              <!-- Shipping / Delivery Charge Definition -->
              <tr style="color: #555;">
                <td style="padding: 10px 12px;">
                  <strong style="color: #333;">Shipping &amp; Delivery Charge</strong>
                  <span style="font-size: 12px; color: #777; display: block; margin-top: 2px;">
                    ${
                      input.quote.shippingLabel ||
                      (input.quote.shippingMethod === "express"
                        ? "Express Delivery"
                        : "Standard Shipping (Within India)")
                    }
                  </span>
                </td>
                <td style="padding: 10px 12px; text-align: right; font-family: monospace;">
                  ${
                    input.quote.shipping && input.quote.shipping.minor > 0
                      ? formatInr(input.quote.shipping)
                      : '<strong style="color: #800020;">FREE</strong>'
                  }
                </td>
              </tr>

              <!-- Total Paid -->
              <tr style="background: #faf7f2; border-top: 2px solid #800020;">
                <td style="padding: 14px 12px; font-weight: bold; color: #800020; font-size: 16px;">Total Paid</td>
                <td style="padding: 14px 12px; font-weight: bold; text-align: right; color: #800020; font-size: 16px; font-family: monospace;">${formatInr(input.quote.total)}</td>
              </tr>
            </tbody>
          </table>

          ${
            input.shippingAddress
              ? `
          <div style="margin: 20px 0; padding: 14px 16px; background: #faf7f2; border: 1px solid #ede3d7; border-radius: 6px; font-family: sans-serif; font-size: 13px;">
            <strong style="color: #800020; font-size: 13px; display: block; margin-bottom: 4px;">Delivery Address</strong>
            <p style="margin: 0; color: #444; line-height: 1.5;">
              ${input.customerName}<br />
              ${input.shippingAddress.line1}${input.shippingAddress.line2 ? `, ${input.shippingAddress.line2}` : ""}<br />
              ${input.shippingAddress.city}, ${input.shippingAddress.state} - ${input.shippingAddress.pincode}
            </p>
          </div>`
              : ""
          }

          <p style="font-size: 13px; color: #735c5c;">Your official tax invoice is attached as a PDF to this email.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #a19090;">
          <p>&copy; ${new Date().getFullYear()} Nivi Sarees. Handcrafted elegance.</p>
        </div>
      </div>
    `;

    await this.client!.emails.send({
      from,
      to: input.to,
      subject: `Your Nivi Order Confirmation — Invoice ${input.invoiceNumber}`,
      html,
      attachments: [
        {
          filename: `Invoice-${input.invoiceNumber}.pdf`,
          content: Buffer.from(input.invoicePdf),
        },
      ],
    });
  }
}
