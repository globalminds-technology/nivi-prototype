"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StorePoliciesDialog, type PolicyTabKey } from "./store-policies-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import {
  confirmPaymentAction,
  createPaymentOrderAction,
  quoteCartAction,
} from "@/app/actions/checkout";
import type { Quote } from "@/core/domain/entities/order";
import { INDIAN_MOBILE_PATTERN, PINCODE_PATTERN, GSTIN_PATTERN } from "@/core/domain/entities/customer";
import type { StoreProductData } from "./product-card";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (res: unknown) => void) => void;
    };
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface CheckoutViewProps {
  products: StoreProductData[];
}

export function CheckoutView({ products }: CheckoutViewProps) {
  const router = useRouter();
  const { items, isLoaded, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Quote State from server
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Shipping Address
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("Tamil Nadu");
  const [shippingPincode, setShippingPincode] = useState("");

  // Billing Address
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingLine1, setBillingLine1] = useState("");
  const [billingLine2, setBillingLine2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("Tamil Nadu");
  const [billingPincode, setBillingPincode] = useState("");

  // Business GST
  const [isBusiness, setIsBusiness] = useState(false);
  const [gstin, setGstin] = useState("");

  // Store Policies Consent & Dialog State
  const [policiesAgreed, setPoliciesAgreed] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyDialogTab, setPolicyDialogTab] = useState<PolicyTabKey>("shipping");

  const openPolicyDialog = (tab: PolicyTabKey) => {
    setPolicyDialogTab(tab);
    setPolicyDialogOpen(true);
  };

  // UI Processing State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Fetch live server quote whenever cart items change
  useEffect(() => {
    if (!isLoaded || items.length === 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setQuote(null);
      return;
    }

    let isMounted = true;
    setIsQuoting(true);
    setQuoteError(null);

    quoteCartAction(
      items.map((i) => ({ sku: i.sku, quantity: i.qty })),
    )
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.quote) {
          setQuote(res.quote);
        } else {
          setQuoteError(res.error || "Unable to quote current cart items");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setQuoteError(err instanceof Error ? err.message : "Cart calculation error");
      })
      .finally(() => {
        if (isMounted) setIsQuoting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoaded, items]);

  // Load Razorpay checkout script if not present
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Full name is required (min 2 characters)";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address";
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!INDIAN_MOBILE_PATTERN.test(cleanPhone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (!shippingLine1.trim() || shippingLine1.trim().length < 3) {
      errors.shippingLine1 = "Address line 1 is required";
    }
    if (!shippingCity.trim() || shippingCity.trim().length < 2) {
      errors.shippingCity = "City is required";
    }
    if (!shippingState.trim()) {
      errors.shippingState = "State is required";
    }
    if (!PINCODE_PATTERN.test(shippingPincode.trim())) {
      errors.shippingPincode = "Enter a valid 6-digit Indian PIN code";
    }

    if (!sameAsShipping) {
      if (!billingLine1.trim() || billingLine1.trim().length < 3) {
        errors.billingLine1 = "Billing address line 1 is required";
      }
      if (!billingCity.trim() || billingCity.trim().length < 2) {
        errors.billingCity = "Billing city is required";
      }
      if (!billingState.trim()) {
        errors.billingState = "Billing state is required";
      }
      if (!PINCODE_PATTERN.test(billingPincode.trim())) {
        errors.billingPincode = "Enter a valid 6-digit Indian PIN code";
      }
    }

    if (isBusiness && gstin.trim()) {
      if (!GSTIN_PATTERN.test(gstin.trim())) {
        errors.gstin = "Enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5)";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = async () => {
    if (!policiesAgreed) {
      toast.error("Please confirm that you have read and agreed to NiVi's Store & Craft Policies (including mandatory continuous unboxing video requirement).");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required delivery details correctly.");
      return;
    }

    if (!items || items.length === 0) {
      toast.error("Your shopping bag is empty.");
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setIsProcessingPayment(true);

    try {
      const cleanPhone = phone.replace(/[\s-]/g, "");
      const checkoutPayload = {
        customer: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          shippingAddress: {
            line1: shippingLine1.trim(),
            line2: shippingLine2.trim() || null,
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPincode.trim(),
            country: "India",
          },
          billingAddress: sameAsShipping
            ? {
                line1: shippingLine1.trim(),
                line2: shippingLine2.trim() || null,
                city: shippingCity.trim(),
                state: shippingState.trim(),
                pincode: shippingPincode.trim(),
                country: "India",
              }
            : {
                line1: billingLine1.trim(),
                line2: billingLine2.trim() || null,
                city: billingCity.trim(),
                state: billingState.trim(),
                pincode: billingPincode.trim(),
                country: "India",
              },
          gstin: isBusiness && gstin.trim() ? gstin.trim() : null,
        },
        items: items.map((i) => ({ sku: i.sku, quantity: i.qty })),
      };

      const res = await createPaymentOrderAction(checkoutPayload);

      if (!res.success || !res.orderId || !res.amountMinor || !res.keyId || !res.snapshot) {
        if (res.outOfStock && res.outOfStock.length > 0) {
          const detail = res.outOfStock
            .map((item) => `${item.sku} (Only ${item.available} left)`)
            .join(", ");
          toast.error(`Some items are out of stock: ${detail}`);
        } else {
          toast.error(res.error || "Failed to create payment order");
        }
        setIsProcessingPayment(false);
        return;
      }

      const snapshot = res.snapshot;

      // When Razorpay keys are not configured or in direct order mode, create order & invoice in Zoho Books directly
      if (res.keyId === "rzp_test_mode" || res.orderId.startsWith("order_test_")) {
        try {
          toast.loading("Placing your order and generating Zoho Books invoice...", { id: "payment-verify" });
          const confirmRes = await confirmPaymentAction(
            {
              razorpayOrderId: res.orderId,
              razorpayPaymentId: `pay_direct_${Date.now()}`,
              razorpaySignature: "direct_order_signature",
            },
            snapshot,
          );

          if (confirmRes.success) {
            toast.success("Order confirmed successfully!", { id: "payment-verify" });
            clearCart();

            if (confirmRes.reviewTokens && confirmRes.reviewTokens.length > 0) {
              try {
                sessionStorage.setItem(
                  "nivi_latest_order_reviews",
                  JSON.stringify(confirmRes.reviewTokens),
                );
              } catch {
                // Ignore
              }
            }

            try {
              sessionStorage.setItem(
                "nivi_latest_order_details",
                JSON.stringify({
                  invoiceNumber: confirmRes.invoiceNumber,
                  invoiceId: confirmRes.invoiceId,
                  customer: snapshot.customer,
                  quote: snapshot.quote,
                }),
              );
            } catch {
              // Ignore
            }

            startTransition(() => {
              router.push(
                `/order/success?invoice=${encodeURIComponent(
                  confirmRes.invoiceNumber || "",
                )}&id=${encodeURIComponent(confirmRes.invoiceId || "")}`,
              );
            });
          } else {
            toast.error(confirmRes.error || "Order placement failed", { id: "payment-verify" });
            setIsProcessingPayment(false);
          }
        } catch (err: unknown) {
          console.error("Direct order confirmation error:", err);
          toast.error("Failed to place order. Please try again.", { id: "payment-verify" });
          setIsProcessingPayment(false);
        }
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait 3 seconds and try again.");
        setIsProcessingPayment(false);
        return;
      }
      const razorpayOptions = {
        key: res.keyId,
        amount: res.amountMinor,
        currency: res.currency || "INR",
        name: "Nivi Sarees",
        description: "Handcrafted Heritage Sarees",
        order_id: res.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          contact: cleanPhone,
        },
        notes: {
          customerName: name.trim(),
        },
        theme: {
          color: "#800020",
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            toast.info("Payment window was closed.");
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            toast.loading("Verifying payment and generating your invoice...", { id: "payment-verify" });
            const confirmRes = await confirmPaymentAction(
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              snapshot,
            );

            if (confirmRes.success) {
              toast.success("Order confirmed successfully!", { id: "payment-verify" });
              clearCart();

              // Store review links in sessionStorage for smooth review prompt on success page
              if (confirmRes.reviewTokens && confirmRes.reviewTokens.length > 0) {
                try {
                  sessionStorage.setItem(
                    "nivi_latest_order_reviews",
                    JSON.stringify(confirmRes.reviewTokens),
                  );
                } catch {
                  // Ignore
                }
              }

              try {
                sessionStorage.setItem(
                  "nivi_latest_order_details",
                  JSON.stringify({
                    invoiceNumber: confirmRes.invoiceNumber,
                    invoiceId: confirmRes.invoiceId,
                    customer: snapshot.customer,
                    quote: snapshot.quote,
                  }),
                );
              } catch {
                // Ignore
              }

              startTransition(() => {
                router.push(
                  `/order/success?invoice=${encodeURIComponent(
                    confirmRes.invoiceNumber || "",
                  )}&id=${encodeURIComponent(confirmRes.invoiceId || "")}`,
                );
              });
            } else {
              toast.error(confirmRes.error || "Payment verification failed", { id: "payment-verify" });
              setIsProcessingPayment(false);
            }
          } catch (err: unknown) {
            console.error("Payment confirmation error:", err);
            toast.error("Error confirming payment. Please contact concierge with your payment ID.", {
              id: "payment-verify",
            });
            setIsProcessingPayment(false);
          }
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    } catch (err: unknown) {
      console.error("Checkout submission failed:", err);
      toast.error(err instanceof Error ? err.message : "Checkout error");
      setIsProcessingPayment(false);
    }
  };

  const formatInr = (minor: number) =>
    `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;

  // If cart is loaded and empty
  if (isLoaded && items.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-2">Your Shopping Bag is Empty</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          Explore our handpicked curation of authentic heritage silks, festive weaves, and timeless sarees.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: "default",
            className: "gap-2 shadow-sm",
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse The Collection</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>256-Bit SSL Secure Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery & Customer Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Contact */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <span>Step 1 of 3</span>
              </div>
              <CardTitle className="font-serif text-xl font-medium">
                Contact Information
              </CardTitle>
              <CardDescription className="text-xs">
                We will email your official GST invoice and tracking updates to this address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name" className="text-xs font-medium">
                  Full Name *
                </Label>
                <Input
                  id="checkout-name"
                  placeholder="e.g. Priyadarshini Sundaram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-email" className="text-xs font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    placeholder="priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={formErrors.email ? "border-destructive" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-destructive">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-phone" className="text-xs font-medium">
                    Mobile Number *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                      +91
                    </span>
                    <Input
                      id="checkout-phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`pl-11 ${formErrors.phone ? "border-destructive" : ""}`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] text-destructive">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Shipping Address */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <span>Step 2 of 3</span>
              </div>
              <CardTitle className="font-serif text-xl font-medium">
                Shipping Address
              </CardTitle>
              <CardDescription className="text-xs">
                Handcrafted packages are delivered insured via BlueDart / Delhivery across India.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="shipping-line1" className="text-xs font-medium">
                  Flat, House No., Building, Street *
                </Label>
                <Input
                  id="shipping-line1"
                  placeholder="e.g. 14B, Heritage Garden Enclave, 4th Cross"
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  className={formErrors.shippingLine1 ? "border-destructive" : ""}
                />
                {formErrors.shippingLine1 && (
                  <p className="text-[11px] text-destructive">{formErrors.shippingLine1}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shipping-line2" className="text-xs font-medium">
                  Landmark, Area / Sector (Optional)
                </Label>
                <Input
                  id="shipping-line2"
                  placeholder="e.g. Near Kapaleeshwarar Temple"
                  value={shippingLine2}
                  onChange={(e) => setShippingLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-city" className="text-xs font-medium">
                    City *
                  </Label>
                  <Input
                    id="shipping-city"
                    placeholder="e.g. Chennai"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className={formErrors.shippingCity ? "border-destructive" : ""}
                  />
                  {formErrors.shippingCity && (
                    <p className="text-[11px] text-destructive">{formErrors.shippingCity}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shipping-state" className="text-xs font-medium">
                    State *
                  </Label>
                  <select
                    id="shipping-state"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shipping-pincode" className="text-xs font-medium">
                    PIN Code *
                  </Label>
                  <Input
                    id="shipping-pincode"
                    placeholder="600004"
                    maxLength={6}
                    value={shippingPincode}
                    onChange={(e) => setShippingPincode(e.target.value)}
                    className={formErrors.shippingPincode ? "border-destructive" : ""}
                  />
                  {formErrors.shippingPincode && (
                    <p className="text-[11px] text-destructive">{formErrors.shippingPincode}</p>
                  )}
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="pt-3 border-t border-border/50">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={sameAsShipping}
                    onCheckedChange={(c) => setSameAsShipping(Boolean(c))}
                  />
                  <span className="text-xs font-medium">
                    Billing address is the same as shipping address
                  </span>
                </label>
              </div>

              {/* Unfolded Billing Address if different */}
              {!sameAsShipping && (
                <div className="pt-3 space-y-4 border-t border-dashed border-border/80">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Billing Address
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="billing-line1" className="text-xs font-medium">
                      Flat, House No., Building, Street *
                    </Label>
                    <Input
                      id="billing-line1"
                      placeholder="e.g. 5A, Gandhi Road"
                      value={billingLine1}
                      onChange={(e) => setBillingLine1(e.target.value)}
                      className={formErrors.billingLine1 ? "border-destructive" : ""}
                    />
                    {formErrors.billingLine1 && (
                      <p className="text-[11px] text-destructive">{formErrors.billingLine1}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billing-line2" className="text-xs font-medium">
                      Landmark, Area (Optional)
                    </Label>
                    <Input
                      id="billing-line2"
                      value={billingLine2}
                      onChange={(e) => setBillingLine2(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="billing-city" className="text-xs font-medium">
                        City *
                      </Label>
                      <Input
                        id="billing-city"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        className={formErrors.billingCity ? "border-destructive" : ""}
                      />
                      {formErrors.billingCity && (
                        <p className="text-[11px] text-destructive">{formErrors.billingCity}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="billing-state" className="text-xs font-medium">
                        State *
                      </Label>
                      <select
                        id="billing-state"
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="billing-pincode" className="text-xs font-medium">
                        PIN Code *
                      </Label>
                      <Input
                        id="billing-pincode"
                        placeholder="600001"
                        maxLength={6}
                        value={billingPincode}
                        onChange={(e) => setBillingPincode(e.target.value)}
                        className={formErrors.billingPincode ? "border-destructive" : ""}
                      />
                      {formErrors.billingPincode && (
                        <p className="text-[11px] text-destructive">{formErrors.billingPincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Business GST Section */}
              <div className="pt-3 border-t border-border/50">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={isBusiness}
                    onCheckedChange={(c) => setIsBusiness(Boolean(c))}
                  />
                  <span className="text-xs font-medium">
                    Purchasing for a registered business (Claim GST Input Credit)
                  </span>
                </label>

                {isBusiness && (
                  <div className="mt-3 pl-6 space-y-1.5">
                    <Label htmlFor="checkout-gstin" className="text-xs font-medium">
                      15-Digit GSTIN Number *
                    </Label>
                    <Input
                      id="checkout-gstin"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className={`font-mono uppercase ${formErrors.gstin ? "border-destructive" : ""}`}
                    />
                    {formErrors.gstin && (
                      <p className="text-[11px] text-destructive">{formErrors.gstin}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Payment Notice */}
          <Card className="shadow-xs border-border/70 bg-secondary/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <span>Step 3 of 3</span>
              </div>
              <CardTitle className="font-serif text-lg font-medium flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>Embedded Razorpay Gateway</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Supports UPI (Google Pay, PhonePe, Paytm), Credit &amp; Debit Cards, NetBanking, and EMI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-background/80 p-3 rounded-md border border-border/60">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Payments are processed directly on Nivi via bank-grade encryption. Your card details never touch our servers.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Store & Craft Policies Accordion */}
          <Card className="shadow-xs border-[#D5CCBB]/80 bg-[#FAF7F0]/80">
            <CardHeader className="pb-3 border-b border-[#D5CCBB]/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#073C35] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌸</span>
                  <span>Store &amp; Craft Policies</span>
                </span>
                <Badge variant="outline" className="text-[10px] bg-[#073C35]/10 text-[#073C35] border-[#073C35]/20">
                  Please Review Before Payment
                </Badge>
              </div>
              <CardTitle className="font-serif text-lg text-[#30251F]">
                Customer Policies &amp; Handloom Disclaimers
              </CardTitle>
              <CardDescription className="text-xs text-[#6B5A4A]">
                Click each section below to review dispatch schedules, return rules, mandatory unboxing video guidelines, and artisanal disclaimers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <Accordion defaultValue={["returns"]} className="w-full">
                {/* 1. SHIPPING POLICY */}
                <AccordionItem value="shipping" className="border-b border-[#D5CCBB]/50 py-1">
                  <AccordionTrigger className="text-xs font-semibold text-[#30251F] hover:text-[#073C35]">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#073C35]" />
                      <span>1. Shipping Policy (Dispatched in 2–3 Days)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-[#4A3D34] space-y-2 pt-1 pb-3 pl-6">
                    <p>• <strong>Payment &amp; Dispatch:</strong> Orders processed only after full payment is received. Dispatched within 2–3 business days (excluding Sundays &amp; public holidays).</p>
                    <p>• <strong>WhatsApp Tracking:</strong> AWB courier tracking details will be shared directly to your WhatsApp once dispatched.</p>
                    <p>• <strong>Courier Partners:</strong> Shipped via verified courier logistics. Timelines are subject to courier partner service speeds.</p>
                    <p>• <strong>International Shipping:</strong> Charges vary based on parcel weight, destination country, and customs clearance.</p>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. RETURN & EXCHANGE POLICY */}
                <AccordionItem value="returns" className="border-b border-[#D5CCBB]/50 py-1">
                  <AccordionTrigger className="text-xs font-semibold text-[#30251F] hover:text-[#073C35]">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[#C9A45C]" />
                      <span>2. Return &amp; Exchange Policy (12–18 Hr Window)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-[#4A3D34] space-y-2.5 pt-1 pb-3 pl-6">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-950 font-medium">
                      ⚠️ <strong>No returns/exchanges for:</strong> Change of mind, colour preference, size issues, fabric feel/texture, or minor 10–15% natural lighting/screen dye variation.
                    </div>
                    <p>• <strong>Accepted strictly for:</strong> Wrong product received or physically damaged product received.</p>
                    <div className="p-2.5 rounded-lg bg-[#073C35]/10 border border-[#073C35]/20 text-[#073C35]">
                      🎥 <strong>Mandatory Continuous Unboxing Video:</strong> A continuous, unedited parcel-opening video is strictly mandatory showing: (1) Unopened parcel, (2) NiVi shipping label, (3) Complete unboxing process, (4) Unfolded product. Claims without continuous video will NOT be accepted.
                    </div>
                    <p>• <strong>Claim Period:</strong> Must be reported to NiVi within <strong>12–18 hours of delivery</strong> via Email &amp; WhatsApp with unboxing video and photos.</p>
                    <p>• <strong>Non-Returnable:</strong> Deal-of-the-day / offer items, customized/stitched products, or used/altered items.</p>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. CANCELLATION POLICY */}
                <AccordionItem value="cancellation" className="border-b border-[#D5CCBB]/50 py-1">
                  <AccordionTrigger className="text-xs font-semibold text-[#30251F] hover:text-[#073C35]">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>3. Cancellation Policy (Strict No-Cancellation)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-[#4A3D34] space-y-2 pt-1 pb-3 pl-6">
                    <p>• <strong>No Cancellations:</strong> Once an order is confirmed and payment is completed, cancellation is not allowed under any circumstances.</p>
                    <p>• <strong>Confirm Before Paying:</strong> Please carefully review product, colour, size, and address details before proceeding.</p>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. DISCLAIMERS */}
                <AccordionItem value="disclaimers" className="py-1">
                  <AccordionTrigger className="text-xs font-semibold text-[#30251F] hover:text-[#073C35]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#073C35]" />
                      <span>4. Disclaimers (Sungudi Sarees &amp; Handloom)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-[#4A3D34] space-y-2 pt-1 pb-3 pl-6">
                    <p>• <strong>Sungudi Border Designs:</strong> Border designs may naturally vary.</p>
                    <p>• <strong>River Sand Marks:</strong> Minor sand marks are normal in Sungudi cotton sarees, as the fabric is traditionally dried on open river sand after dyeing.</p>
                    <p>• <strong>Handmade Nature:</strong> Minor smudges or dye irregularities are organic characteristics of handmade sarees, not stains or defects.</p>
                    <p>• <strong>Zari Line Marks:</strong> Zari line marks may occur during traditional starching and ironing; they relax and soften naturally after washing.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-5">
          <Card className="sticky top-20 shadow-md border-border/80 bg-card">
            <CardHeader className="pb-4 border-b border-border/60">
              <CardTitle className="font-serif text-xl font-medium flex items-center justify-between">
                <span>Order Summary</span>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {items.reduce((s, i) => s + i.qty, 0)} {items.reduce((s, i) => s + i.qty, 0) === 1 ? "Item" : "Items"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Product list */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => {
                  const product = products.find(
                    (p) => p.sku.toLowerCase() === item.sku.toLowerCase(),
                  );
                  const quoteLine = quote?.lines.find(
                    (ql) => ql.sku.toLowerCase() === item.sku.toLowerCase(),
                  );

                  return (
                    <div
                      key={item.sku}
                      className="flex items-center gap-3 text-sm py-2 border-b border-border/40 last:border-b-0"
                    >
                      <div className="relative w-14 h-16 rounded-md bg-muted overflow-hidden shrink-0 border border-border/60">
                        {product?.primaryImageUrl ? (
                          <Image
                            src={product.primaryImageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-primary/90 text-primary-foreground text-[10px] font-mono px-1 rounded-tl-sm">
                          ×{item.qty}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">
                          {product?.name || item.sku}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                        {quoteLine?.offerLabel && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] mt-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none px-1.5 py-0"
                          >
                            {quoteLine.offerLabel}
                          </Badge>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {quoteLine && quoteLine.lineDiscount.minor > 0 && (
                          <p className="font-mono text-[11px] text-muted-foreground line-through">
                            {formatInr(quoteLine.lineSubtotal.minor)}
                          </p>
                        )}
                        <p className="font-mono text-xs font-semibold">
                          {quoteLine
                            ? formatInr(quoteLine.lineTotal.minor)
                            : product
                            ? formatInr(product.priceMinor * item.qty)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {quoteError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertTitle className="text-xs font-semibold">Pricing Note</AlertTitle>
                  <AlertDescription className="text-[11px]">{quoteError}</AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {quote ? formatInr(quote.subtotal.minor) : "Calculating..."}
                  </span>
                </div>

                {quote && quote.discount.minor > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Festive Discount</span>
                    <span className="font-mono">-{formatInr(quote.discount.minor)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>Insured Domestic Shipping</span>
                  </div>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    FREE
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Taxes (GST Inclusive)</span>
                  <span className="font-mono text-muted-foreground/80">
                    {quote ? formatInr(quote.tax.minor) : "Included"}
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex items-baseline justify-between text-base font-semibold pt-1">
                  <span className="font-serif">Total Amount</span>
                  <span className="font-mono text-xl font-bold text-primary">
                    {quote ? formatInr(quote.total.minor) : "—"}
                  </span>
                </div>
              </div>

              {/* Policy Acknowledgment Checkbox */}
              <div className="pt-2 pb-1 border-t border-border/50">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <Checkbox
                    id="policy-consent"
                    checked={policiesAgreed}
                    onCheckedChange={(c) => setPoliciesAgreed(Boolean(c))}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-[11px] text-[#4A3D34] leading-snug">
                    I have read and agree to NiVi&apos;s{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openPolicyDialog("shipping");
                      }}
                      className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#C9A45C] cursor-pointer"
                    >
                      Shipping
                    </button>
                    ,{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openPolicyDialog("returns");
                      }}
                      className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#C9A45C] cursor-pointer"
                    >
                      Return &amp; Exchange (Mandatory Unboxing Video)
                    </button>
                    ,{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openPolicyDialog("cancellation");
                      }}
                      className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#C9A45C] cursor-pointer"
                    >
                      Cancellation
                    </button>{" "}
                    policies and{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openPolicyDialog("disclaimers");
                      }}
                      className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#C9A45C] cursor-pointer"
                    >
                      Craft Disclaimers
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* Pay Now Button */}
              <Button
                onClick={handleProceedToPayment}
                disabled={isQuoting || isProcessingPayment || isPending || items.length === 0}
                className="w-full h-12 text-sm font-semibold tracking-wide gap-2 shadow-md cursor-pointer"
                size="lg"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    <span>Opening Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {quote ? formatInr(quote.total.minor) : ""} Securely</span>
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Official GST Tax Invoice issued immediately on purchase</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Policy Modal */}
      <StorePoliciesDialog
        open={policyDialogOpen}
        onClose={() => setPolicyDialogOpen(false)}
        defaultTab={policyDialogTab}
      />
    </div>
  );
}
