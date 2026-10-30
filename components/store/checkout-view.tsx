"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit2,
  Info,
  Loader2,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
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
  getShippingOptionsAction,
  lookupPincodeAction,
  quoteCartAction,
} from "@/app/actions/checkout";
import type { Quote } from "@/core/domain/entities/order";
import type { ShippingOption } from "@/core/application/ports/shipping-repository";
import {
  INDIAN_MOBILE_PATTERN,
  INDIAN_STATES,
  PINCODE_PATTERN,
} from "@/core/domain/entities/customer";
import type { StoreProductData } from "./product-card";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (res: unknown) => void) => void;
    };
  }
}

interface CheckoutViewProps {
  products: StoreProductData[];
}

export function CheckoutView({ products }: CheckoutViewProps) {
  const router = useRouter();
  const { items, isLoaded, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Wizard Step State: 1 = Details & Address, 2 = Delivery & Payment
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Mobile Order Summary Drawer Toggle
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Store & Handloom Guidelines Quick Toggle
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // Quote State from server
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Shipping Method State (null initially until selected by customer in Step 2)
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);

  // Form Fields - Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Shipping Address
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("Tamil Nadu");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingPincodeLoading, setShippingPincodeLoading] = useState(false);
  const [shippingPincodeSuccess, setShippingPincodeSuccess] = useState(false);
  const [shippingPincodeError, setShippingPincodeError] = useState<string | null>(null);
  const [shippingPlaces, setShippingPlaces] = useState<string[]>([]);

  // Billing Address
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingLine1, setBillingLine1] = useState("");
  const [billingLine2, setBillingLine2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("Tamil Nadu");
  const [billingPincode, setBillingPincode] = useState("");
  const [billingPincodeLoading, setBillingPincodeLoading] = useState(false);
  const [billingPincodeSuccess, setBillingPincodeSuccess] = useState(false);
  const [billingPincodeError, setBillingPincodeError] = useState<string | null>(null);
  const [billingPlaces, setBillingPlaces] = useState<string[]>([]);

  const handleShippingPincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setShippingPincode(clean);

    if (formErrors.shippingPincode) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.shippingPincode;
        return next;
      });
    }

    if (clean.length < 6) {
      setShippingPincodeSuccess(false);
      setShippingPincodeError(null);
      setShippingPlaces([]);
      return;
    }

    if (clean.length === 6) {
      setShippingPincodeLoading(true);
      setShippingPincodeError(null);
      try {
        const res = await lookupPincodeAction(clean);
        if (res.success && res.city && res.state) {
          setShippingCity(res.city);
          setShippingState(res.state);
          setShippingPlaces(res.places || []);
          setShippingPincodeSuccess(true);
          setShippingPincodeError(null);
          setFormErrors((prev) => {
            const next = { ...prev };
            delete next.shippingCity;
            delete next.shippingState;
            delete next.shippingPincode;
            return next;
          });
        } else {
          setShippingPincodeSuccess(false);
          setShippingPincodeError(res.error || "PIN code not found. Please enter city & state manually.");
        }
      } catch {
        setShippingPincodeSuccess(false);
        setShippingPincodeError("Unable to auto-detect area. Please enter city & state manually.");
      } finally {
        setShippingPincodeLoading(false);
      }
    }
  };

  const handleBillingPincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setBillingPincode(clean);

    if (formErrors.billingPincode) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.billingPincode;
        return next;
      });
    }

    if (clean.length < 6) {
      setBillingPincodeSuccess(false);
      setBillingPincodeError(null);
      setBillingPlaces([]);
      return;
    }

    if (clean.length === 6) {
      setBillingPincodeLoading(true);
      setBillingPincodeError(null);
      try {
        const res = await lookupPincodeAction(clean);
        if (res.success && res.city && res.state) {
          setBillingCity(res.city);
          setBillingState(res.state);
          setBillingPlaces(res.places || []);
          setBillingPincodeSuccess(true);
          setBillingPincodeError(null);
          setFormErrors((prev) => {
            const next = { ...prev };
            delete next.billingCity;
            delete next.billingState;
            delete next.billingPincode;
            return next;
          });
        } else {
          setBillingPincodeSuccess(false);
          setBillingPincodeError(res.error || "PIN code not found. Please enter city & state manually.");
        }
      } catch {
        setBillingPincodeSuccess(false);
        setBillingPincodeError("Unable to auto-detect area. Please enter city & state manually.");
      } finally {
        setBillingPincodeLoading(false);
      }
    }
  };

  // Store Policies Consent & Dialog State
  const [policiesAgreed, setPoliciesAgreed] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyDialogTab, setPolicyDialogTab] = useState<PolicyTabKey>("shipping");

  const openPolicyDialog = (tab: PolicyTabKey) => {
    setPolicyDialogTab(tab);
    setPolicyDialogOpen(true);
  };

  // UI Processing State & Inline Validation
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Industry Standard Inline Field Validators
  const validateNameField = (val: string): string | null => {
    if (!val.trim()) return "Full name is required";
    if (val.trim().length < 2) return "Full name must be at least 2 characters";
    return null;
  };

  const validateEmailField = (val: string): string | null => {
    if (!val.trim()) return "Email address is required for your invoice and dispatch receipt";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim())) {
      return "Please enter a valid email address (e.g. priya@example.com)";
    }
    return null;
  };

  const validatePhoneField = (val: string): string | null => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return "10-digit mobile number is required for delivery coordination";
    if (!/^[6-9]/.test(clean)) return "Indian mobile numbers must start with 6, 7, 8, or 9";
    if (clean.length !== 10) return `Mobile number must be 10 digits (currently ${clean.length}/10)`;
    return null;
  };

  const validateLine1Field = (val: string): string | null => {
    if (!val.trim()) return "Flat, building, and street address is required";
    if (val.trim().length < 3) return "Address must be at least 3 characters";
    return null;
  };

  const validateCityField = (val: string): string | null => {
    if (!val.trim()) return "City / District is required";
    if (val.trim().length < 2) return "City must be at least 2 characters";
    return null;
  };

  const validateStateField = (val: string): string | null => {
    if (!val.trim()) return "State is required";
    return null;
  };

  const validatePincodeField = (val: string): string | null => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return "6-digit PIN code is required";
    if (clean.length !== 6) return `PIN code must be 6 digits (currently ${clean.length}/6)`;
    if (!PINCODE_PATTERN.test(clean)) return "Enter a valid 6-digit Indian PIN code";
    return null;
  };

  const setFieldError = (field: string, error: string | null) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Field change handlers with live clearing
  const handleNameChange = (val: string) => {
    setName(val);
    if (touched.name || formErrors.name) {
      setFieldError("name", validateNameField(val));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email || formErrors.email) {
      setFieldError("email", validateEmailField(val));
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (touched.phone || formErrors.phone) {
      setFieldError("phone", validatePhoneField(digits));
    }
  };

  const handleShippingLine1Change = (val: string) => {
    setShippingLine1(val);
    if (touched.shippingLine1 || formErrors.shippingLine1) {
      setFieldError("shippingLine1", validateLine1Field(val));
    }
  };

  const handleShippingCityChange = (val: string) => {
    setShippingCity(val);
    if (touched.shippingCity || formErrors.shippingCity) {
      setFieldError("shippingCity", validateCityField(val));
    }
  };

  const handleShippingStateChange = (val: string) => {
    setShippingState(val);
    if (touched.shippingState || formErrors.shippingState) {
      setFieldError("shippingState", validateStateField(val));
    }
  };

  const handleBillingLine1Change = (val: string) => {
    setBillingLine1(val);
    if (touched.billingLine1 || formErrors.billingLine1) {
      setFieldError("billingLine1", validateLine1Field(val));
    }
  };

  const handleBillingCityChange = (val: string) => {
    setBillingCity(val);
    if (touched.billingCity || formErrors.billingCity) {
      setFieldError("billingCity", validateCityField(val));
    }
  };

  const handleBillingStateChange = (val: string) => {
    setBillingState(val);
    if (touched.billingState || formErrors.billingState) {
      setFieldError("billingState", validateStateField(val));
    }
  };

  // Fetch live shipping options on mount
  useEffect(() => {
    getShippingOptionsAction().then((res) => {
      if (res.success && res.options) {
        setShippingOptions(res.options);
      }
    });
  }, []);

  // Fetch live server quote whenever cart items or shipping method change
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
      shippingMethod || "standard",
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
  }, [isLoaded, items, shippingMethod]);

  // Load Razorpay checkout script if not present
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const allTouched: Record<string, boolean> = {
      name: true,
      email: true,
      phone: true,
      shippingPincode: true,
      shippingCity: true,
      shippingState: true,
      shippingLine1: true,
    };
    if (!sameAsShipping) {
      allTouched.billingPincode = true;
      allTouched.billingCity = true;
      allTouched.billingState = true;
      allTouched.billingLine1 = true;
    }
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const errors: Record<string, string> = {};

    const nameErr = validateNameField(name);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmailField(email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhoneField(phone);
    if (phoneErr) errors.phone = phoneErr;

    const pincodeErr = validatePincodeField(shippingPincode);
    if (pincodeErr) errors.shippingPincode = pincodeErr;

    const cityErr = validateCityField(shippingCity);
    if (cityErr) errors.shippingCity = cityErr;

    const stateErr = validateStateField(shippingState);
    if (stateErr) errors.shippingState = stateErr;

    const line1Err = validateLine1Field(shippingLine1);
    if (line1Err) errors.shippingLine1 = line1Err;

    if (!sameAsShipping) {
      const bPincodeErr = validatePincodeField(billingPincode);
      if (bPincodeErr) errors.billingPincode = bPincodeErr;

      const bCityErr = validateCityField(billingCity);
      if (bCityErr) errors.billingCity = bCityErr;

      const bStateErr = validateStateField(billingState);
      if (bStateErr) errors.billingState = bStateErr;

      const bLine1Err = validateLine1Field(billingLine1);
      if (bLine1Err) errors.billingLine1 = bLine1Err;
    }

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    if (!isValid) {
      toast.error("Please fill in all required contact and delivery fields.");
    }
    return isValid;
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!policiesAgreed) {
      toast.error(
        "Please confirm that you have read and agreed to NiVi's Store Policies (including mandatory continuous unboxing video requirement).",
      );
      return;
    }

    if (!shippingMethod) {
      toast.error("Please select a delivery option (Standard Shipping or Express Delivery).");
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
          gstin: null,
        },
        items: items.map((i) => ({ sku: i.sku, quantity: i.qty })),
        shippingMethod,
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
          toast.loading("Placing your order and generating receipt...", { id: "payment-verify" });
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
        name: "NiVi",
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
          color: "#073C35",
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
            toast.loading("Verifying payment and generating receipt...", { id: "payment-verify" });
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
        <h1 className="font-serif text-3xl font-semibold mb-2 text-[#30251F]">Your Shopping Bag is Empty</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          Explore our handpicked curation of authentic heritage silks, festive weaves, and timeless sarees.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: "default",
            className: "gap-2 shadow-xs bg-[#073C35] hover:bg-[#052C27] text-white",
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse The Collection</span>
        </Link>
      </div>
    );
  }

  const standardOption = shippingOptions.find((o) => o.type === "standard");
  const expressOption = shippingOptions.find((o) => o.type === "express");
  const totalItemCount = items.reduce((s, i) => s + i.qty, 0);

  // Shipping charge is active once customer selects an option (Standard or Express)
  const isShippingActive = shippingMethod !== null;
  const netSubtotalMinor = quote
    ? Math.max(0, quote.subtotal.minor - quote.discount.minor)
    : 0;
  const displayedTotalMinor = isShippingActive && quote
    ? quote.total.minor
    : netSubtotalMinor;

  return (
    <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      {/* Top Navigation Bar & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E7DFD5]">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#786960] hover:text-[#073C35] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex sm:hidden items-center gap-1.5 text-xs font-medium text-[#786960]">
            <Lock className="w-3.5 h-3.5 text-[#073C35]" />
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* 2-Step Wizard Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentStep === 1
                ? "text-[#073C35] font-semibold"
                : "text-[#786960] hover:text-[#073C35]"
            }`}
          >
            <span
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all ${
                currentStep === 1
                  ? "bg-[#073C35] text-white shadow-xs"
                  : "bg-emerald-100 text-[#073C35]"
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
            </span>
            <span>1. Contact &amp; Address</span>
          </button>

          <span className="text-[#C8BEB5] text-xs">/</span>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(2);
              }
            }}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentStep === 2
                ? "text-[#073C35] font-semibold"
                : "text-[#786960] hover:text-[#073C35]"
            }`}
          >
            <span
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all ${
                currentStep === 2
                  ? "bg-[#073C35] text-white shadow-xs"
                  : "bg-[#E7DFD5] text-[#786960]"
              }`}
            >
              2
            </span>
            <span>2. Order Summary &amp; Payment</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#786960]">
          <Lock className="w-3.5 h-3.5 text-[#073C35]" />
          <span>Secure Checkout</span>
        </div>
      </div>

      {/* Mobile Collapsible Order Summary Banner (Step 1 Only) */}
      {currentStep === 1 && (
        <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-white border border-[#E7DFD5] rounded-xl text-xs font-medium text-[#30251F] shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#073C35]" />
            <span className="text-[#073C35] font-semibold">
              {mobileSummaryOpen ? "Hide Order Summary" : `Show Order Summary (${totalItemCount} ${totalItemCount === 1 ? "Item" : "Items"})`}
            </span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <span className="font-mono font-bold text-sm text-[#073C35]">
            {quote ? formatInr(displayedTotalMinor) : "—"}
          </span>
        </button>

        {mobileSummaryOpen && (
          <Card className="mt-2 border border-[#E7DFD5] bg-white shadow-sm p-4 space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const product = products.find(
                  (p) => p.sku.toLowerCase() === item.sku.toLowerCase(),
                );
                const quoteLine = quote?.lines.find(
                  (ql) => ql.sku.toLowerCase() === item.sku.toLowerCase(),
                );
                const imageUrl = product?.primaryImageUrl || (product?.id ? `/api/images/zoho/${product.id}` : null);

                return (
                  <div key={item.sku} className="flex items-center gap-3 text-xs py-2 border-b border-border/40 last:border-b-0">
                    <div className="relative w-12 h-14 rounded-md bg-[#FAF4EA] overflow-hidden shrink-0 border border-[#E7DFD5]">
                      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-[#FAF4EA] text-[#B0A292]">
                        <Package className="w-4 h-4 opacity-50 text-[#7AA79D]" />
                      </div>
                      {imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imageUrl}
                          alt=""
                          className="relative z-1 w-full h-full object-cover object-top"
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="absolute bottom-0 right-0 bg-[#073C35] text-white text-[9px] font-mono px-1 rounded-tl-sm z-10">
                        ×{item.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-[#30251F]">{product?.name || item.sku}</p>
                      <p className="text-[11px] text-[#786960]">Qty: {item.qty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold text-[#30251F]">
                        {quoteLine ? formatInr(quoteLine.lineTotal.minor) : product ? formatInr(product.priceMinor * item.qty) : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-[#30251F]">{quote ? formatInr(quote.subtotal.minor) : "Calculating..."}</span>
              </div>
              {quote && quote.discount.minor > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Festive Discount</span>
                  <span className="font-mono">-{formatInr(quote.discount.minor)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-baseline justify-between text-sm font-semibold pt-1">
                <span className="font-serif text-[#30251F]">Total Amount</span>
                <span className="font-mono text-lg font-bold text-[#073C35]">
                  {quote ? formatInr(netSubtotalMinor) : "—"}
                </span>
              </div>
            </div>
          </Card>
        )}
        </div>
      )}

      {/* Main Single-Column Checkout Flow */}
      <div className="w-full space-y-6">
          {/* ================= STEP 1: CONTACT & ADDRESS ================= */}
          {currentStep === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleContinueToStep2();
              }}
              className="space-y-6 animate-in fade-in-50 duration-200"
            >
              {/* Customer Contact */}
              <Card className="shadow-xs border border-[#E7DFD5] bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#073C35] uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-[#073C35]/10 text-[#073C35] inline-flex items-center justify-center font-bold text-[11px]">
                      1
                    </span>
                    <span>Contact Information</span>
                  </div>
                  <CardTitle className="font-serif text-xl font-normal text-[#30251F]">
                    Customer Details
                  </CardTitle>
                  <CardDescription className="text-xs text-[#786960]">
                    We will email your order confirmation and dispatch updates here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-name" className="text-xs font-medium text-[#30251F]">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <Input
                        id="checkout-name"
                        autoComplete="name"
                        placeholder="e.g. Priyadarshini Sundaram"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={() => {
                          markTouched("name");
                          setFieldError("name", validateNameField(name));
                        }}
                        className={`pr-9 ${
                          (touched.name || formErrors.name) && formErrors.name
                            ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                            : touched.name && !formErrors.name && name.trim().length >= 2
                            ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-2.5 pointer-events-none">
                        {(touched.name || formErrors.name) && formErrors.name ? (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        ) : touched.name && !formErrors.name && name.trim().length >= 2 ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {(touched.name || formErrors.name) && formErrors.name ? (
                      <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.name}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-email" className="text-xs font-medium text-[#30251F]">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Input
                          id="checkout-email"
                          type="email"
                          autoComplete="email"
                          placeholder="priya@example.com"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => {
                            markTouched("email");
                            setFieldError("email", validateEmailField(email));
                          }}
                          className={`pr-9 ${
                            (touched.email || formErrors.email) && formErrors.email
                              ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                              : touched.email && !formErrors.email && email.trim()
                              ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                              : ""
                          }`}
                        />
                        <div className="absolute right-3 top-2.5 pointer-events-none">
                          {(touched.email || formErrors.email) && formErrors.email ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : touched.email && !formErrors.email && email.trim() ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : null}
                        </div>
                      </div>
                      {(touched.email || formErrors.email) && formErrors.email ? (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.email}</span>
                        </p>
                      ) : touched.email && !formErrors.email && email.trim() ? (
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Order confirmation and invoice will be sent here</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          For order invoice and shipment tracking updates
                        </p>
                      )}
                    </div>

                    {/* Mobile Phone Number */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkout-phone" className="text-xs font-medium text-[#30251F]">
                          Mobile Number *
                        </Label>
                        {phone.length > 0 && phone.length < 10 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {phone.length}/10 digits
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                          +91
                        </span>
                        <Input
                          id="checkout-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          autoComplete="tel"
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onBlur={() => {
                            markTouched("phone");
                            setFieldError("phone", validatePhoneField(phone));
                          }}
                          className={`pl-11 pr-9 font-mono ${
                            (touched.phone || formErrors.phone) && formErrors.phone
                              ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                              : phone.length === 10 && /^[6-9]/.test(phone)
                              ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                              : ""
                          }`}
                        />
                        <div className="absolute right-3 top-2.5 pointer-events-none">
                          {(touched.phone || formErrors.phone) && formErrors.phone ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : phone.length === 10 && /^[6-9]/.test(phone) ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : null}
                        </div>
                      </div>
                      {(touched.phone || formErrors.phone) && formErrors.phone ? (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      ) : phone.length === 10 && /^[6-9]/.test(phone) ? (
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Verified 10-digit Indian mobile format</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          For delivery courier coordination &amp; dispatch SMS
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="shadow-xs border border-[#E7DFD5] bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#073C35] uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-[#073C35]/10 text-[#073C35] inline-flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <span>Delivery Address</span>
                  </div>
                  <CardTitle className="font-serif text-xl font-normal text-[#30251F]">
                    Where Should We Ship Your Saree?
                  </CardTitle>
                  <CardDescription className="text-xs text-[#786960]">
                    Carefully handcrafted parcels dispatched safely across India.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 1. PIN Code (First) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shipping-pincode" className="text-xs font-medium text-[#30251F] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#073C35]" />
                        <span>PIN Code *</span>
                      </Label>
                      {shippingPincodeSuccess && (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Postal Area</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="shipping-pincode"
                        placeholder="Enter 6-digit PIN (e.g. 600004)"
                        maxLength={6}
                        inputMode="numeric"
                        value={shippingPincode}
                        onChange={(e) => handleShippingPincodeChange(e.target.value)}
                        onBlur={() => {
                          markTouched("shippingPincode");
                          setFieldError("shippingPincode", validatePincodeField(shippingPincode));
                        }}
                        className={`font-mono text-sm tracking-wider pr-9 ${
                          (touched.shippingPincode || formErrors.shippingPincode) && formErrors.shippingPincode
                            ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                            : shippingPincodeSuccess
                            ? "border-emerald-600/70 focus-visible:ring-emerald-600 bg-emerald-50/20"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-2.5">
                        {shippingPincodeLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#073C35]" />
                        ) : (touched.shippingPincode || formErrors.shippingPincode) && formErrors.shippingPincode ? (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        ) : shippingPincodeSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {/* Real-time Status & Feedback */}
                    {(touched.shippingPincode || formErrors.shippingPincode) && formErrors.shippingPincode ? (
                      <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.shippingPincode}</span>
                      </p>
                    ) : shippingPincodeLoading ? (
                      <p className="text-[11px] text-[#073C35] flex items-center gap-1.5 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Auto-detecting city and state from postal directory...</span>
                      </p>
                    ) : shippingPincodeSuccess ? (
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Auto-detected: {shippingCity}, {shippingState}</span>
                      </p>
                    ) : shippingPincodeError ? (
                      <p className="text-[11px] text-amber-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>{shippingPincodeError}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Type your 6-digit PIN code to automatically fill City and State.
                      </p>
                    )}
                  </div>

                  {/* 2. City & State (Auto-filled) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="shipping-city" className="text-xs font-medium text-[#30251F]">
                          City / District *
                        </Label>
                        {shippingPincodeSuccess && shippingCity && (
                          <span className="text-[10px] text-emerald-700 font-medium">Auto-detected</span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="shipping-city"
                          placeholder="e.g. Chennai"
                          value={shippingCity}
                          onChange={(e) => handleShippingCityChange(e.target.value)}
                          onBlur={() => {
                            markTouched("shippingCity");
                            setFieldError("shippingCity", validateCityField(shippingCity));
                          }}
                          className={`pr-9 ${
                            (touched.shippingCity || formErrors.shippingCity) && formErrors.shippingCity
                              ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                              : touched.shippingCity && !formErrors.shippingCity && shippingCity.trim().length >= 2
                              ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                              : ""
                          }`}
                        />
                        <div className="absolute right-3 top-2.5 pointer-events-none">
                          {(touched.shippingCity || formErrors.shippingCity) && formErrors.shippingCity ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : touched.shippingCity && !formErrors.shippingCity && shippingCity.trim().length >= 2 ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : null}
                        </div>
                      </div>
                      {(touched.shippingCity || formErrors.shippingCity) && formErrors.shippingCity && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.shippingCity}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="shipping-state" className="text-xs font-medium text-[#30251F]">
                          State *
                        </Label>
                        {shippingPincodeSuccess && shippingState && (
                          <span className="text-[10px] text-emerald-700 font-medium">Auto-detected</span>
                        )}
                      </div>
                      <select
                        id="shipping-state"
                        value={shippingState}
                        onChange={(e) => handleShippingStateChange(e.target.value)}
                        onBlur={() => {
                          markTouched("shippingState");
                          setFieldError("shippingState", validateStateField(shippingState));
                        }}
                        className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
                          (touched.shippingState || formErrors.shippingState) && formErrors.shippingState
                            ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                            : "border-input"
                        }`}
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {(touched.shippingState || formErrors.shippingState) && formErrors.shippingState && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.shippingState}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Street Address Line 1 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-line1" className="text-xs font-medium text-[#30251F]">
                      Flat, House No., Building, Street *
                    </Label>
                    <div className="relative">
                      <Input
                        id="shipping-line1"
                        autoComplete="street-address"
                        placeholder="e.g. 14B, Heritage Garden Enclave, 4th Cross"
                        value={shippingLine1}
                        onChange={(e) => handleShippingLine1Change(e.target.value)}
                        onBlur={() => {
                          markTouched("shippingLine1");
                          setFieldError("shippingLine1", validateLine1Field(shippingLine1));
                        }}
                        className={`pr-9 ${
                          (touched.shippingLine1 || formErrors.shippingLine1) && formErrors.shippingLine1
                            ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                            : touched.shippingLine1 && !formErrors.shippingLine1 && shippingLine1.trim().length >= 3
                            ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-2.5 pointer-events-none">
                        {(touched.shippingLine1 || formErrors.shippingLine1) && formErrors.shippingLine1 ? (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        ) : touched.shippingLine1 && !formErrors.shippingLine1 && shippingLine1.trim().length >= 3 ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {(touched.shippingLine1 || formErrors.shippingLine1) && formErrors.shippingLine1 && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.shippingLine1}</span>
                      </p>
                    )}
                  </div>

                  {/* 4. Landmark & Area Line 2 with Locality chips */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-line2" className="text-xs font-medium text-[#30251F]">
                      Landmark, Area / Sector (Optional)
                    </Label>
                    <Input
                      id="shipping-line2"
                      placeholder="e.g. Near Kapaleeshwarar Temple"
                      value={shippingLine2}
                      onChange={(e) => setShippingLine2(e.target.value)}
                    />

                    {/* Postal Area Suggestion Chips */}
                    {shippingPlaces.length > 0 && (
                      <div className="pt-1.5">
                        <p className="text-[11px] text-[#786960] mb-1.5 font-medium">
                          Quick select locality / post office:
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {shippingPlaces.map((place) => (
                            <button
                              key={place}
                              type="button"
                              onClick={() => setShippingLine2(place)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                shippingLine2.toLowerCase() === place.toLowerCase()
                                  ? "bg-[#073C35] text-white border-[#073C35] font-medium shadow-2xs"
                                  : "bg-muted/50 hover:bg-[#073C35]/10 border-border/80 text-[#30251F]"
                              }`}
                            >
                              {place}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billing Address Toggle */}
                  <div className="pt-3 border-t border-border/50">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <Checkbox
                        checked={sameAsShipping}
                        onCheckedChange={(c) => setSameAsShipping(Boolean(c))}
                      />
                      <span className="text-xs font-medium text-[#30251F]">
                        Billing address is the same as shipping address
                      </span>
                    </label>
                  </div>

                  {/* Unfolded Billing Address if different */}
                  {!sameAsShipping && (
                    <div className="pt-3 space-y-4 border-t border-dashed border-border/80 animate-in fade-in-50 duration-150">
                      <p className="text-xs font-semibold text-[#073C35] uppercase tracking-wider">
                        Billing Address
                      </p>

                      {/* Billing PIN Code (First) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="billing-pincode" className="text-xs font-medium text-[#30251F] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#073C35]" />
                            <span>Billing PIN Code *</span>
                          </Label>
                          {billingPincodeSuccess && (
                            <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            id="billing-pincode"
                            placeholder="Enter 6-digit PIN"
                            maxLength={6}
                            inputMode="numeric"
                            value={billingPincode}
                            onChange={(e) => handleBillingPincodeChange(e.target.value)}
                            onBlur={() => {
                              markTouched("billingPincode");
                              setFieldError("billingPincode", validatePincodeField(billingPincode));
                            }}
                            className={`font-mono text-sm tracking-wider pr-9 ${
                              (touched.billingPincode || formErrors.billingPincode) && formErrors.billingPincode
                                ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                                : billingPincodeSuccess
                                ? "border-emerald-600/70 focus-visible:ring-emerald-600 bg-emerald-50/20"
                                : ""
                            }`}
                          />
                          <div className="absolute right-3 top-2.5">
                            {billingPincodeLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#073C35]" />
                            ) : (touched.billingPincode || formErrors.billingPincode) && formErrors.billingPincode ? (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            ) : billingPincodeSuccess ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : null}
                          </div>
                        </div>
                        {(touched.billingPincode || formErrors.billingPincode) && formErrors.billingPincode ? (
                          <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.billingPincode}</span>
                          </p>
                        ) : billingPincodeLoading ? (
                          <p className="text-[11px] text-[#073C35] flex items-center gap-1.5 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Auto-detecting city and state...</span>
                          </p>
                        ) : billingPincodeSuccess ? (
                          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Auto-detected: {billingCity}, {billingState}</span>
                          </p>
                        ) : billingPincodeError ? (
                          <p className="text-[11px] text-amber-700 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>{billingPincodeError}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Type PIN code to auto-detect City and State.
                          </p>
                        )}
                      </div>

                      {/* Billing City & State (Auto-filled) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="billing-city" className="text-xs font-medium text-[#30251F]">
                              City / District *
                            </Label>
                            {billingPincodeSuccess && billingCity && (
                              <span className="text-[10px] text-emerald-700 font-medium">Auto-detected</span>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              id="billing-city"
                              value={billingCity}
                              onChange={(e) => handleBillingCityChange(e.target.value)}
                              onBlur={() => {
                                markTouched("billingCity");
                                setFieldError("billingCity", validateCityField(billingCity));
                              }}
                              className={`pr-9 ${
                                (touched.billingCity || formErrors.billingCity) && formErrors.billingCity
                                  ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                                  : touched.billingCity && !formErrors.billingCity && billingCity.trim().length >= 2
                                  ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                                  : ""
                              }`}
                            />
                            <div className="absolute right-3 top-2.5 pointer-events-none">
                              {(touched.billingCity || formErrors.billingCity) && formErrors.billingCity ? (
                                <AlertCircle className="w-4 h-4 text-destructive" />
                              ) : touched.billingCity && !formErrors.billingCity && billingCity.trim().length >= 2 ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : null}
                            </div>
                          </div>
                          {(touched.billingCity || formErrors.billingCity) && formErrors.billingCity && (
                            <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{formErrors.billingCity}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="billing-state" className="text-xs font-medium text-[#30251F]">
                              State *
                            </Label>
                            {billingPincodeSuccess && billingState && (
                              <span className="text-[10px] text-emerald-700 font-medium">Auto-detected</span>
                            )}
                          </div>
                          <select
                            id="billing-state"
                            value={billingState}
                            onChange={(e) => handleBillingStateChange(e.target.value)}
                            onBlur={() => {
                              markTouched("billingState");
                              setFieldError("billingState", validateStateField(billingState));
                            }}
                            className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
                              (touched.billingState || formErrors.billingState) && formErrors.billingState
                                ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                                : "border-input"
                            }`}
                          >
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {(touched.billingState || formErrors.billingState) && formErrors.billingState && (
                            <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{formErrors.billingState}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Billing Street Line 1 */}
                      <div className="space-y-1.5">
                        <Label htmlFor="billing-line1" className="text-xs font-medium text-[#30251F]">
                          Flat, House No., Building, Street *
                        </Label>
                        <div className="relative">
                          <Input
                            id="billing-line1"
                            placeholder="e.g. 5A, Gandhi Road"
                            value={billingLine1}
                            onChange={(e) => handleBillingLine1Change(e.target.value)}
                            onBlur={() => {
                              markTouched("billingLine1");
                              setFieldError("billingLine1", validateLine1Field(billingLine1));
                            }}
                            className={`pr-9 ${
                              (touched.billingLine1 || formErrors.billingLine1) && formErrors.billingLine1
                                ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                                : touched.billingLine1 && !formErrors.billingLine1 && billingLine1.trim().length >= 3
                                ? "border-emerald-600/60 focus-visible:ring-emerald-600 bg-emerald-50/20"
                                : ""
                            }`}
                          />
                          <div className="absolute right-3 top-2.5 pointer-events-none">
                            {(touched.billingLine1 || formErrors.billingLine1) && formErrors.billingLine1 ? (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            ) : touched.billingLine1 && !formErrors.billingLine1 && billingLine1.trim().length >= 3 ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : null}
                          </div>
                        </div>
                        {(touched.billingLine1 || formErrors.billingLine1) && formErrors.billingLine1 && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.billingLine1}</span>
                          </p>
                        )}
                      </div>

                      {/* Billing Landmark Line 2 */}
                      <div className="space-y-1.5">
                        <Label htmlFor="billing-line2" className="text-xs font-medium text-[#30251F]">
                          Landmark, Area (Optional)
                        </Label>
                        <Input
                          id="billing-line2"
                          value={billingLine2}
                          onChange={(e) => setBillingLine2(e.target.value)}
                        />
                        {billingPlaces.length > 0 && (
                          <div className="pt-1.5">
                            <p className="text-[11px] text-[#786960] mb-1.5 font-medium">
                              Quick select locality / post office:
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                              {billingPlaces.map((place) => (
                                <button
                                  key={place}
                                  type="button"
                                  onClick={() => setBillingLine2(place)}
                                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                    billingLine2.toLowerCase() === place.toLowerCase()
                                      ? "bg-[#073C35] text-white border-[#073C35] font-medium shadow-2xs"
                                      : "bg-muted/50 hover:bg-[#073C35]/10 border-border/80 text-[#30251F]"
                                  }`}
                                >
                                  {place}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Next: Choose delivery speed &amp; complete payment
                    </p>
                    <Button
                      type="button"
                      onClick={handleContinueToStep2}
                      className="w-full sm:w-auto px-8 h-12 text-sm font-semibold tracking-wide gap-2.5 rounded-full shadow-md cursor-pointer bg-[#073C35] hover:bg-[#052C27] text-white transition-all"
                    >
                      <span>Continue to Delivery Option</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {/* ================= STEP 2: ORDER SUMMARY & PAYMENT ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in-50 duration-200">
              {/* Card 1: Ordered Items (with Delivery Option & Payment Mode inside) */}
              <Card className="shadow-xs border border-[#E7DFD5] bg-white rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 sm:px-5 border-b border-[#E7DFD5]/70 bg-[#FAF8F5]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#073C35]" />
                      <span className="font-serif text-sm sm:text-base font-semibold text-[#30251F]">
                        Ordered Items
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] sm:text-xs font-mono text-[#073C35] border-[#073C35]/30">
                      {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Products list */}
                  <div className="divide-y divide-[#E7DFD5]/60 space-y-3">
                    {items.map((item) => {
                      const product = products.find(
                        (p) => p.sku.toLowerCase() === item.sku.toLowerCase(),
                      );
                      const quoteLine = quote?.lines.find(
                        (ql) => ql.sku.toLowerCase() === item.sku.toLowerCase(),
                      );
                      const imageUrl = product?.primaryImageUrl || (product?.id ? `/api/images/zoho/${product.id}` : null);

                      return (
                        <div key={item.sku} className="pt-3 first:pt-0 flex gap-3 sm:gap-4 items-start">
                          {/* Thumbnail */}
                          <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-[#FAF4EA] overflow-hidden shrink-0 border border-[#E7DFD5]">
                            <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-[#FAF4EA] text-[#B0A292]">
                              <Package className="w-6 h-6 opacity-40 text-[#7AA79D]" />
                            </div>
                            {imageUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={imageUrl}
                                alt={product?.name || item.sku}
                                className="relative z-1 w-full h-full object-cover object-top"
                                loading="eager"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                            <span className="absolute bottom-0 right-0 bg-[#073C35] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-tl-sm z-10">
                              ×{item.qty}
                            </span>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-semibold text-xs sm:text-sm text-[#30251F] leading-snug line-clamp-2">
                              {product?.name || item.sku}
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm sm:text-base font-bold text-[#073C35]">
                                  {quoteLine
                                    ? formatInr(quoteLine.lineTotal.minor)
                                    : product
                                    ? formatInr(product.priceMinor * item.qty)
                                    : "—"}
                                </span>
                                {quoteLine && quoteLine.lineDiscount.minor > 0 && (
                                  <span className="font-mono text-xs text-[#786960] line-through">
                                    {formatInr(quoteLine.lineSubtotal.minor)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[#786960] font-medium">
                                Qty: {item.qty}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-3" />

                  {/* Delivery Option & Payment Mode nested inside Ordered Items */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#073C35]" />
                      <span className="font-serif text-sm sm:text-base font-semibold text-[#30251F]">
                        Delivery Option &amp; Payment Mode
                      </span>
                    </div>

                    {/* Delivery Selection Tabs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#30251F]">
                          Choose Delivery Speed:
                        </span>
                        <span className="text-[11px] text-[#786960]">
                          Click to select
                        </span>
                      </div>

                      <div
                        role="tablist"
                        aria-label="Shipping Options"
                        className="bg-[#F5EFE6] p-1.5 rounded-xl sm:rounded-2xl border border-[#D5CCBB] grid grid-cols-2 gap-1.5 shadow-2xs"
                      >
                        {/* Tab 1: Standard Delivery */}
                        <button
                          type="button"
                          role="tab"
                          aria-selected={shippingMethod === "standard"}
                          onClick={() => setShippingMethod("standard")}
                          className={`p-3 sm:p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                            shippingMethod === "standard"
                              ? "bg-white text-[#073C35] shadow-sm border border-[#073C35]/40 ring-2 ring-[#073C35]/15 font-semibold"
                              : "bg-transparent text-[#6B5A4A] hover:bg-white/60 hover:text-[#221811] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                  shippingMethod === "standard"
                                    ? "bg-[#073C35]/10 text-[#073C35]"
                                    : "bg-[#E7DFD5] text-[#8C7A6B]"
                                }`}
                              >
                                <Truck className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-xs sm:text-sm tracking-tight block leading-tight">
                                Standard Shipping
                              </span>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                shippingMethod === "standard"
                                  ? "border-[#073C35] bg-[#073C35]"
                                  : "border-[#C5B8A5]"
                              }`}
                            >
                              {shippingMethod === "standard" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1.5 border-t border-[#D5CCBB]/40">
                            <span className="text-[10px] sm:text-xs text-[#786960]">Within India</span>
                            <span
                              className={`font-mono font-bold text-xs sm:text-sm ${
                                shippingMethod === "standard" ? "text-[#073C35]" : "text-[#30251F]"
                              }`}
                            >
                              {(() => {
                                const std = shippingOptions.find((o) => o.type === "standard");
                                if (!std) return "FREE";
                                return std.rate === 0 ? "FREE" : formatInr(std.rateMinor);
                              })()}
                            </span>
                          </div>
                        </button>

                        {/* Tab 2: Express Delivery */}
                        <button
                          type="button"
                          role="tab"
                          aria-selected={shippingMethod === "express"}
                          onClick={() => setShippingMethod("express")}
                          className={`p-3 sm:p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                            shippingMethod === "express"
                              ? "bg-white text-[#694208] shadow-sm border border-[#694208]/40 ring-2 ring-[#694208]/15 font-semibold"
                              : "bg-transparent text-[#6B5A4A] hover:bg-white/60 hover:text-[#221811] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                  shippingMethod === "express"
                                    ? "bg-[#694208]/10 text-[#694208]"
                                    : "bg-[#E7DFD5] text-[#8C7A6B]"
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-xs sm:text-sm tracking-tight block leading-tight">
                                Express Delivery
                              </span>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                shippingMethod === "express"
                                  ? "border-[#694208] bg-[#694208]"
                                  : "border-[#C5B8A5]"
                              }`}
                            >
                              {shippingMethod === "express" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1.5 border-t border-[#D5CCBB]/40">
                            <span className="text-[10px] sm:text-xs text-[#786960]">Express Priority</span>
                            <span
                              className={`font-mono font-bold text-xs sm:text-sm ${
                                shippingMethod === "express" ? "text-[#694208]" : "text-[#30251F]"
                              }`}
                            >
                              {(() => {
                                const exp = shippingOptions.find((o) => o.type === "express");
                                if (!exp) return "₹350";
                                return formatInr(exp.rateMinor);
                              })()}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Payment Mode Banner */}
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-[#30251F]">
                            Online Payment via Razorpay
                          </p>
                          <p className="text-[11px] text-[#786960]">
                            UPI (GPay, PhonePe, Paytm), Cards, NetBanking
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 shrink-0 font-medium">
                        100% Secure
                      </Badge>
                    </div>

                    {/* Mandatory Continuous Unboxing Video Reminder */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-[11px] sm:text-xs text-[#4A3D34] space-y-1">
                      <p className="font-semibold text-[#073C35] flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>Mandatory Unboxing Video Policy:</span>
                      </p>
                      <p className="text-[#5C4D42] pl-5">
                        To protect authentic handloom products, an uncut 360° unboxing video from package receipt is mandatory for any transit claims within 12–18 hours.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Delivery Address Card (Image 2 style) */}
              <Card className="shadow-xs border border-[#E7DFD5] bg-white rounded-xl sm:rounded-2xl">
                <CardHeader className="py-3 px-4 sm:px-5 border-b border-[#E7DFD5]/70 bg-[#FAF8F5]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#073C35]" />
                      <span className="font-serif text-sm sm:text-base font-semibold text-[#30251F]">
                        Delivery Address
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="h-7 sm:h-8 text-xs border-[#073C35]/30 text-[#073C35] hover:bg-[#073C35]/10 shrink-0 gap-1 cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#30251F] text-sm sm:text-base">
                        {name || "Customer Name"}
                      </span>
                      {phone && (
                        <span className="font-mono text-[#4A3D34] font-medium">
                          +91 {phone}
                        </span>
                      )}
                    </div>
                    <p className="text-[#5C4D42] leading-relaxed pt-0.5">
                      {shippingLine1}
                      {shippingLine2 ? `, ${shippingLine2}` : ""}
                      {shippingCity ? `, ${shippingCity}` : ""}
                      {shippingState ? `, ${shippingState}` : ""}
                      {shippingPincode ? ` - ${shippingPincode}` : ""}
                    </p>
                    <p className="text-[11px] text-[#786960] font-mono pt-1">
                      Updates sent to: <span className="text-[#30251F] font-sans font-medium">{email}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Price Details Card (with Policy Agreement combined inside) */}
              <Card className="shadow-xs border border-[#E7DFD5] bg-white rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 sm:px-5 border-b border-[#E7DFD5]/70 bg-[#FAF8F5]/60">
                  <span className="font-serif text-sm sm:text-base font-semibold text-[#30251F]">
                    Price Details ({totalItemCount} {totalItemCount === 1 ? "Item" : "Items"})
                  </span>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-[#5C4D42]">
                    <span>Total Product Price</span>
                    <span className="font-mono text-[#30251F] font-medium">
                      {quote ? formatInr(quote.subtotal.minor) : "Calculating..."}
                    </span>
                  </div>

                  {quote && quote.discount.minor > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Festive Discount</span>
                      <span className="font-mono">-{formatInr(quote.discount.minor)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#5C4D42]">
                    <div className="flex items-center gap-1.5">
                      <span>Delivery Fee</span>
                      {shippingMethod && (
                        <span className="text-[10px] text-[#786960]">
                          ({shippingMethod === "express" ? "Express Priority" : "Standard"})
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-medium text-[#30251F]">
                      {quote && quote.shipping.minor === 0
                        ? "FREE"
                        : quote
                        ? formatInr(quote.shipping.minor)
                        : "—"}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-baseline justify-between text-base sm:text-lg font-semibold pt-1">
                    <span className="font-serif text-[#30251F]">Order Total</span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#073C35]">
                      {quote ? formatInr(displayedTotalMinor) : "—"}
                    </span>
                  </div>
                </CardContent>

                {/* Combined Policy Agreement Area */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#E7DFD5] bg-[#FAF8F5]/60">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <Checkbox
                      id="policy-consent-step2"
                      checked={policiesAgreed}
                      onCheckedChange={(c) => setPoliciesAgreed(Boolean(c))}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] sm:text-xs text-[#4A3D34] leading-snug">
                      I agree to NiVi&apos;s{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openPolicyDialog("shipping");
                        }}
                        className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#694208] cursor-pointer"
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
                        className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#694208] cursor-pointer"
                      >
                        Return &amp; Exchange (Unboxing Video)
                      </button>
                      , and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openPolicyDialog("disclaimers");
                        }}
                        className="text-[#073C35] font-semibold underline underline-offset-2 hover:text-[#694208] cursor-pointer"
                      >
                        Handloom Disclaimers
                      </button>
                      .
                    </span>
                  </label>
                </div>
              </Card>

              {/* Bottom Action Area: Pay Button */}
              <div className="space-y-3 pt-1">

                {/* Buttons: Back to Address & Pay Securely */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto h-12 px-5 text-xs font-medium border-[#E7DFD5] text-[#30251F] hover:bg-muted rounded-full cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Back to Address</span>
                  </Button>

                  {/* The EXACT Pay Button from Image 3 */}
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isQuoting || isProcessingPayment || isPending || items.length === 0 || !shippingMethod}
                    className="w-full sm:flex-1 h-12 px-8 text-sm sm:text-base font-semibold tracking-wide gap-2.5 rounded-full cursor-pointer bg-[#073C35] hover:bg-[#052C27] text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessingPayment ? (
                      <>
                        <span className="animate-spin mr-1">⏳</span>
                        <span>Opening Razorpay Payment...</span>
                      </>
                    ) : !shippingMethod ? (
                      <>
                        <Truck className="w-4 h-4" />
                        <span>Select Delivery Option</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>Pay {quote ? formatInr(displayedTotalMinor) : ""} Securely</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
