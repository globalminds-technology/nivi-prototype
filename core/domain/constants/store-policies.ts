/**
 * Official Store Policies for NiVi
 * Sourced directly from brand guidelines.
 */

export interface PolicySection {
  id: "shipping" | "returns" | "cancellation" | "disclaimers";
  title: string;
  badge: string;
  iconName: string;
  summary: string;
  content: {
    heading?: string;
    subheading?: string;
    paragraphs?: string[];
    bulletPoints?: { label?: string; text: string }[];
    callouts?: { type: "info" | "warning" | "success" | "video"; title: string; text: string }[];
  }[];
}

export const STORE_POLICIES: Record<string, PolicySection> = {
  shipping: {
    id: "shipping",
    title: "Shipping Policy",
    badge: "Dispatches in 2–3 Days",
    iconName: "Truck",
    summary: "Orders processed after full payment. Dispatched within 2-3 business days with tracking sent to your WhatsApp.",
    content: [
      {
        heading: "Order Processing & Dispatch",
        paragraphs: [
          "Orders are processed only after full payment is received.",
          "Orders are typically processed and dispatched within 2–3 business days, excluding Sundays and public holidays.",
          "Orders are shipped through trusted courier and logistics partners across India.",
        ],
        bulletPoints: [
          {
            label: "WhatsApp Tracking Updates:",
            text: "Tracking details will be shared directly to your registered WhatsApp number once your order is dispatched.",
          },
          {
            label: "Transit Timelines:",
            text: "Once the parcel is handed over to the courier partner, delivery timelines may vary depending on destination pincode, courier service speed, local logistics, and unforeseen delays.",
          },
          {
            label: "International Shipping:",
            text: "International shipping charges vary depending on parcel weight, destination country, customs clearance, and courier tariff.",
          },
        ],
      },
    ],
  },

  returns: {
    id: "returns",
    title: "Return & Exchange Policy",
    badge: "12–18 Hour Claim Window",
    iconName: "RotateCcw",
    summary: "Accepted strictly for wrong or damaged items. Continuous unedited parcel unboxing video is mandatory.",
    content: [
      {
        heading: "Important Notice: Please Read Carefully",
        paragraphs: [
          "At NiVi, every saree is carefully checked and packed by hand before dispatch to ensure heirloom quality.",
        ],
        callouts: [
          {
            type: "warning",
            title: "NiVi does NOT accept returns or exchanges for:",
            text: "• Change of mind\n• Colour preference\n• Size issues\n• Fabric feel or texture preference\n• Minor colour variations",
          },
          {
            type: "info",
            title: "10–15% Colour Variation Notice",
            text: "A 10–15% colour variation may naturally occur due to studio lighting, photography, digital device screen calibrations, and artisan dye-lot differences. Such subtle variations are not considered a product defect.",
          },
        ],
      },
      {
        heading: "When Returns / Exchanges Are Accepted",
        paragraphs: [
          "Returns and exchanges are accepted strictly and exclusively for:",
        ],
        bulletPoints: [
          { label: "Wrong Product Received:", text: "You received a completely different item than ordered." },
          { label: "Damaged Product Received:", text: "The saree arrived physically damaged in transit." },
        ],
      },
      {
        heading: "🎥 Mandatory Unboxing Video Requirement",
        paragraphs: [
          "A continuous, unedited parcel-opening video is strictly mandatory for any damage or wrong-product claim.",
          "The video recording must clearly show all 4 stages without any cuts or pauses:",
        ],
        bulletPoints: [
          { label: "1. Unopened Parcel:", text: "All sides of the sealed outer courier parcel before opening." },
          { label: "2. Shipping Label:", text: "Clear, readable close-up of the pasted NiVi shipping label with your AWB number." },
          { label: "3. Complete Opening Process:", text: "The continuous cutting of seal and unboxing in real time." },
          { label: "4. Product Received:", text: "Clear unfolding showing the entire saree and the reported defect." },
        ],
        callouts: [
          {
            type: "warning",
            title: "Strict Video Requirement",
            text: "Claims submitted without a proper, continuous, unedited unboxing video will NOT be accepted under any circumstances.",
          },
        ],
      },
      {
        heading: "⏰ Claim Window: 12–18 Hours of Delivery",
        paragraphs: [
          "Any damage or wrong-product issue must be reported to NiVi within 12–18 hours of delivery.",
          "Please submit your claim via Email (connect@brandnivi.com) and WhatsApp (+91 91509 92863) including:",
        ],
        bulletPoints: [
          { text: "Continuous unboxing video" },
          { text: "Clear high-resolution photographs of the product" },
          { text: "Photographs of the outer packaging and shipping label" },
        ],
      },
      {
        heading: "💰 Refund & Exchange Resolution",
        paragraphs: [
          "If your claim is verified and approved, NiVi may provide a replacement, exchange, or refund depending on current inventory availability and the case circumstances.",
          "Return shipping arrangements and applicable instructions will be communicated once the return is approved.",
          "Refunds, where applicable, are initiated after the returned product reaches our facility and undergoes physical quality verification.",
        ],
      },
      {
        heading: "🚫 Non-Returnable & Non-Exchangeable Items",
        bulletPoints: [
          { text: "Deal-of-the-Day / special-offer / sale products" },
          { text: "Customized, fall/pico stitched, or altered products" },
          { text: "Products that have been worn, washed, draped, scented, or damaged after delivery" },
          { text: "Items without original packaging or attached NiVi tags" },
        ],
      },
    ],
  },

  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    badge: "Strict No-Cancellation",
    iconName: "XCircle",
    summary: "Once an order is confirmed and payment is completed, cancellations are not permitted.",
    content: [
      {
        heading: "Order Cancellation Guidelines",
        paragraphs: [
          "Once an order is confirmed and payment is received, cancellation is not allowed under any circumstances.",
          "Because each saree is reserved from live boutique stock and swiftly allotted to the packing and courier queue, we cannot cancel or modify orders once placed.",
        ],
        callouts: [
          {
            type: "warning",
            title: "Confirm Before Paying",
            text: "Please carefully confirm the product, colour, weave, measurements, and all delivery details before making payment.",
          },
        ],
      },
    ],
  },

  disclaimers: {
    id: "disclaimers",
    title: "Product & Craft Disclaimers",
    badge: "Sungudi & Handloom",
    iconName: "Info",
    summary: "Traditional Sungudi river sand marks, artisan smudges, and zari line relaxation characteristics.",
    content: [
      {
        heading: "🌸 Sungudi Sarees – Artisan Craft Disclaimer",
        paragraphs: [
          "Traditional Sungudi cotton sarees are handcrafted by master tie-and-dye artisans. Border designs may naturally vary.",
          "Please note the following intrinsic artisan characteristics:",
        ],
        bulletPoints: [
          {
            label: "1. Sand Marks:",
            text: "Minor sand marks are completely normal in Sungudi cotton sarees, as the fabric is traditionally dried on open river sand after hand-dyeing.",
          },
          {
            label: "2. Handmade Nature:",
            text: "Minor smudges, small wax droplets, or dye irregularities are natural hallmarks of authentic handmade sarees and should not be considered stains or defects.",
          },
          {
            label: "3. Zari Line Marks:",
            text: "Zari line marks may occur during traditional starching and hot-iron pressing. These are not considered damage, as the marks naturally relax and soften after washing.",
          },
        ],
        callouts: [
          {
            type: "success",
            title: "Woven with Tradition",
            text: "Thank you for understanding and appreciating the genuine beauty and human touch of traditional handmade Sungudi sarees.",
          },
        ],
      },
      {
        heading: "🌿 Pure Handloom & Silk Weave Authenticity",
        paragraphs: [
          "Authentic handloom sarees (such as Kanchipuram, Banarasi, Linen, and Silk Cotton) feature unique artisan handcrafting:",
        ],
        bulletPoints: [
          {
            label: "Organic Slubs & Texture:",
            text: "Hand-spun natural silk and cotton threads exhibit organic texture variations, subtle thread joints, and slub lines that distinguish real handloom textiles from machine-made polyester imitations.",
          },
          {
            label: "Care & Preservation:",
            text: "Dry clean exclusively for pure silk and zari weaves. Store gently wrapped in unbleached cotton muslin cloth. Avoid spraying perfume directly onto pure metallic zari.",
          },
        ],
      },
    ],
  },
};
