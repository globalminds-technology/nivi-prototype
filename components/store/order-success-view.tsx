"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatInr(minor: number): string {
  const major = Math.round(minor / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(major);
}

interface StoredOrderDetails {
  invoiceNumber: string;
  invoiceId?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: {
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
  };
  quote?: {
    lines: Array<{
      sku: string;
      name: string;
      quantity: number;
      unitPrice: { minor: number };
      unitDiscount: { minor: number };
      unitNet: { minor: number };
      offerLabel?: string | null;
      lineSubtotal: { minor: number };
      lineDiscount: { minor: number };
      lineTotal: { minor: number };
    }>;
    subtotal: { minor: number };
    discount: { minor: number };
    tax: { minor: number };
    total: { minor: number };
  };
}

export function OrderSuccessView() {
  const searchParams = useSearchParams();
  const invoiceParam = searchParams.get("invoice") || "Processing";

  const [reviewTokens, setReviewTokens] = useState<Array<{ sku: string; token: string }>>([]);
  const [orderDetails, setOrderDetails] = useState<StoredOrderDetails | null>(null);

  useEffect(() => {
    try {
      const storedReviews = sessionStorage.getItem("nivi_latest_order_reviews");
      if (storedReviews) {
        setReviewTokens(JSON.parse(storedReviews));
      }
    } catch {
      // Ignore
    }

    try {
      const storedDetails = sessionStorage.getItem("nivi_latest_order_details");
      if (storedDetails) {
        setOrderDetails(JSON.parse(storedDetails));
      }
    } catch {
      // Ignore
    }
  }, []);

  const invoiceNumber = orderDetails?.invoiceNumber || invoiceParam;
  const quote = orderDetails?.quote;
  const customer = orderDetails?.customer;

  const whatsappMessage = encodeURIComponent(
    `Hello Nivi Concierge! I just placed an order (Invoice: ${invoiceNumber}). Could you provide delivery updates?`,
  );
  const whatsappUrl = `https://wa.me/919840000000?text=${whatsappMessage}`;

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
          <CheckCircle className="w-10 h-10" />
        </div>
        <Badge
          variant="secondary"
          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs px-3 py-1"
        >
          Payment Verified &amp; Confirmed
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
          Thank you for choosing Nivi
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Your order has been recorded in our workshop. Each saree is inspected by hand and packaged in protective archival wraps before dispatch.
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Details & Official Invoice Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardDescription className="text-xs">Official Tax Invoice</CardDescription>
                <CardTitle className="font-mono text-xl font-bold tracking-tight text-primary">
                  {invoiceNumber}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Recorded in Zoho Books</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* If ordered items are available, display items list with offer discounts */}
            {quote && quote.lines.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h3 className="font-serif text-sm font-semibold">Ordered Creations</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {quote.lines.reduce((acc, l) => acc + l.quantity, 0)} {quote.lines.reduce((acc, l) => acc + l.quantity, 0) === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                <div className="space-y-3">
                  {quote.lines.map((line) => (
                    <div
                      key={line.sku}
                      className="flex items-center justify-between gap-3 text-xs py-2 border-b border-border/30 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{line.name}</p>
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            ×{line.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            SKU: {line.sku}
                          </span>
                          {line.offerLabel && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none px-1.5 py-0 inline-flex items-center gap-1"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{line.offerLabel}</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {line.lineDiscount.minor > 0 && (
                          <p className="font-mono text-[11px] text-muted-foreground line-through">
                            {formatInr(line.lineSubtotal.minor)}
                          </p>
                        )}
                        <p className="font-mono font-semibold text-foreground">
                          {formatInr(line.lineTotal.minor)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="bg-secondary/15 rounded-lg p-3.5 space-y-2 text-xs border border-border/40">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatInr(quote.subtotal.minor)}</span>
                  </div>

                  {quote.discount.minor > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Promotional Offer Applied</span>
                      </span>
                      <span className="font-mono">-{formatInr(quote.discount.minor)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-primary" />
                      <span>Insured Domestic Shipping</span>
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">FREE</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span className="font-mono text-muted-foreground/80">
                      GST Included ({formatInr(quote.tax.minor)})
                    </span>
                  </div>

                  <Separator className="my-1.5" />

                  <div className="flex items-baseline justify-between text-sm font-semibold pt-0.5">
                    <span className="font-serif">Total Paid</span>
                    <span className="font-mono text-base font-bold text-primary">
                      {formatInr(quote.total.minor)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address Details */}
            {customer && (
              <div className="p-3.5 rounded-lg bg-background border border-border/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Destination</span>
                </div>
                <p className="font-semibold text-foreground">{customer.name}</p>
                <p className="text-muted-foreground">
                  {customer.shippingAddress.line1}
                  {customer.shippingAddress.line2 ? `, ${customer.shippingAddress.line2}` : ""}
                  , {customer.shippingAddress.city}, {customer.shippingAddress.state} - {customer.shippingAddress.pincode}
                </p>
                <p className="text-muted-foreground font-mono">
                  Phone: +91 {customer.phone} · Email: {customer.email}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Invoice Emailed</p>
                  <p className="text-muted-foreground mt-0.5">
                    Your official GST PDF invoice and receipt have been dispatched to your email.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
                <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Insured Dispatch</p>
                  <p className="text-muted-foreground mt-0.5">
                    Your shipment will be dispatched within 24–48 hours via BlueDart / Delhivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Concierge support */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-lg border border-border/50">
              <div className="text-xs text-left">
                <p className="font-medium">Have bespoke requests or questions?</p>
                <p className="text-muted-foreground">
                  Our Chennai boutique concierge is available directly on WhatsApp.
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "gap-1.5 shrink-0 w-full sm:w-auto",
                })}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Verified Buyer Review Prompt */}
        {reviewTokens.length > 0 && (
          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-lg font-medium">
                    Verified Buyer Review
                  </CardTitle>
                  <CardDescription className="text-xs">
                    As a verified buyer, your thoughts help preserve and celebrate handloom traditions.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewTokens.map((rt) => (
                <div
                  key={rt.sku}
                  className="flex items-center justify-between p-3 bg-background rounded-md border border-border/60 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold">{rt.sku}</span>
                    <span className="text-muted-foreground ml-2">Review this weave</span>
                  </div>
                  <Link
                    href={`/review/${rt.token}`}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: "text-xs h-8 gap-1",
                    })}
                  >
                    <span>Write Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className: "w-full sm:w-auto px-8 gap-2 shadow-sm",
            })}
          >
            <span>Explore More Creations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

