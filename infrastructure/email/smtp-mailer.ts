import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { Mailer, SendOrderConfirmationInput } from "@/core/application/ports/mailer";
import { env } from "@/infrastructure/config/env";
import { Money } from "@/core/domain/value-objects/money";

export class SmtpMailer implements Mailer {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const config = env();
      const host = config.MAIL_SERVER || "smtp.gmail.com";
      const port = config.MAIL_PORT || 465;
      const isSecure = port === 465 || config.MAIL_USE_TLS?.toLowerCase() === "true";

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user: config.MAIL_USERNAME,
          pass: config.MAIL_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    const config = env();
    const transporter = this.getTransporter();
    const from = config.MAIL_FROM || `"Nivi Sarees" <${config.MAIL_USERNAME || "orders@nivi.in"}>`;

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
          <h1 style="color: #0a3d31; font-size: 28px; margin: 0; letter-spacing: 0.1em;">N I V I</h1>
          <p style="color: #c5a059; font-size: 13px; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.2em;">Heritage Silk &amp; Festive Elegance</p>
        </div>
        <div style="background: #fffdfc; border: 1px solid #f0e6e6; border-radius: 8px; padding: 24px;">
          <h2 style="font-size: 20px; color: #0a3d31; margin-top: 0;">Order Confirmed</h2>
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
              <tr>
                <td style="padding: 12px; font-weight: bold; border-top: 2px solid #0a3d31;">Total</td>
                <td style="padding: 12px; font-weight: bold; text-align: right; border-top: 2px solid #0a3d31;">${formatInr(input.quote.total)}</td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 13px; color: #735c5c;">Your official tax invoice from Zoho Books is attached as a PDF to this email.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #a19090;">
          <p>&copy; ${new Date().getFullYear()} Nivi Sarees. Handcrafted elegance.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: input.to,
      subject: `Your Nivi Order Confirmation — Invoice ${input.invoiceNumber}`,
      html,
      attachments: [
        {
          filename: `Invoice-${input.invoiceNumber}.pdf`,
          content: Buffer.from(input.invoicePdf),
          contentType: "application/pdf",
        },
      ],
    });
  }
}
