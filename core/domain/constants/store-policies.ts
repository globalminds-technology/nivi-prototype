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
        heading: "Shipping Policy",
        bulletPoints: [
          { text: "Orders are processed only after full payment is received." },
          { text: "Orders are shipped through trusted courier/logistics partners." },
          { text: "Delivery timelines may vary depending on the destination, courier service, customs clearance, and unforeseen delays." },
          { text: "Tracking details will be shared once the order is dispatched to your whatsapp" },
          { text: "Once the parcel is handed over to the courier, delivery is subject to the courier partner's service and timelines." },
          { label: "International shipping charges:", text: "may vary depending on the parcel weight, destination, and courier charges." },
        ],
        paragraphs: [
          "Orders are typically processed and dispatched within 2-3 business days, excluding Sundays and public holidays.",
        ],
      },
    ],
  },

  returns: {
    id: "returns",
    title: "Return & Exchange Policy",
    badge: "12–18 Hour Claim Window",
    iconName: "RotateCcw",
    summary: "Returns/exchanges accepted only for wrong or damaged items. Continuous unboxing video is mandatory.",
    content: [
      {
        heading: "Return & Exchange Policy",
        paragraphs: [
          "Please read carefully before placing your order.",
        ],
        callouts: [
          {
            type: "warning",
            title: "NiVi does not accept returns or exchanges for:",
            text: "• Change of mind\n• Colour preference\n• Size issues\n• Fabric feel or texture preference\n• Minor colour variations",
          },
          {
            type: "info",
            title: "Colour Variation Notice",
            text: "A 10–15% colour variation may occur due to lighting, photography, screen settings, and dye-lot differences. Such variations are not considered a product defect.",
          },
        ],
      },
      {
        heading: "Returns/Exchanges Are Accepted Only For:",
        bulletPoints: [
          { text: "Wrong product received" },
          { text: "Damaged product received" },
        ],
      },
      {
        heading: "Mandatory Unboxing Video",
        paragraphs: [
          "A continuous, unedited parcel-opening video is mandatory for any damage or wrong-product claim.",
          "The video must clearly show:",
        ],
        bulletPoints: [
          { label: "1.", text: "The unopened parcel" },
          { label: "2.", text: "The shipping label" },
          { label: "3.", text: "The complete opening process" },
          { label: "4.", text: "The product received" },
        ],
        callouts: [
          {
            type: "warning",
            title: "Important",
            text: "Claims without a proper continuous unboxing video may not be accepted.",
          },
        ],
      },
      {
        heading: "Claim Period",
        paragraphs: [
          "1. Any damage or wrong-product issue must be reported to NiVi within 12-18 hours of delivery.",
          "The following must be provided with the claim thru email and whatsapp:",
        ],
        bulletPoints: [
          { text: "Continuous unboxing video" },
          { text: "Clear photographs of the product" },
          { text: "Photographs of the packaging and shipping label" },
        ],
      },
      {
        heading: "Refund / Exchange",
        paragraphs: [
          "If the claim is approved, NiVi may provide a replacement, exchange, or refund, depending on product availability and the circumstances of the case.",
          "Return shipping arrangements and applicable charges will be communicated when the return is approved.",
          "Refunds, where applicable, will be processed after the returned product is received and successfully verified.",
        ],
      },
      {
        heading: "Non-Returnable Items",
        paragraphs: [
          "The following items are non-returnable and non-exchangeable:",
        ],
        bulletPoints: [
          { text: "Deal-of-the-Day / special-offer products" },
          { text: "Customized or stitched products" },
          { text: "Products that have been used, washed, altered, or damaged after delivery" },
          { text: "Items without original packaging or NiVi tags, where applicable" },
        ],
      },
      {
        heading: "Shop With Confidence",
        paragraphs: [
          "At NiVi, every saree is carefully checked and packed before dispatch.",
          "We request our customers to review the product details, photographs, colour, measurements, and other information carefully before confirming the order.",
          "Thank you for choosing NiVi - Women with Tradition, Styled for Today",
        ],
      },
    ],
  },

  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    badge: "Cancellation Not Allowed",
    iconName: "XCircle",
    summary: "Once an order is confirmed and payment is received, cancellation is not allowed.",
    content: [
      {
        heading: "Cancellation Policy",
        bulletPoints: [
          { text: "Once an order is confirmed and payment is received, cancellation is not allowed." },
          { text: "Please carefully confirm the product, colour, size, and other details before making payment." },
        ],
      },
    ],
  },

  disclaimers: {
    id: "disclaimers",
    title: "Product & Craft Disclaimers",
    badge: "Handloom & Sungudi",
    iconName: "Info",
    summary: "Handloom silk cotton variations and traditional handmade Sungudi saree craft characteristics.",
    content: [
      {
        heading: "HANDLOOM SILK COTTON SAREES – DISCLAIMER",
        paragraphs: [
          "Please Note:",
        ],
        bulletPoints: [
          {
            label: "1. Handloom Variations:",
            text: "Minor irregularities in weaving, texture, and thread appearance are natural characteristics of handloom sarees.",
          },
          {
            label: "2. Colour Variation:",
            text: "Slight colour variations may occur due to lighting, photography, and differences in screen settings.",
          },
          {
            label: "3. Weaving Marks:",
            text: "Minor weaving irregularities, thread knots, or small slubs may be present and are not considered defects.",
          },
          {
            label: "4. Zari & Border:",
            text: "Slight variations in zari work, border alignment, or design placement may occur due to the handmade weaving process.",
          },
          {
            label: "5. Fabric Texture:",
            text: "Handloom silk cotton sarees may have slight variations in texture and finish, reflecting their handcrafted nature.",
          },
        ],
        callouts: [
          {
            type: "info",
            title: "Artisan Craftsmanship",
            text: "Every handloom saree is unique. Thank you for appreciating and supporting our traditional weavers through NiVi - Women with Tradition, Styled for Today.",
          },
        ],
      },
      {
        heading: "SUNGUDI SAREES – DISCLAIMER",
        paragraphs: [
          "Border designs may vary.",
          "Please Note:",
        ],
        bulletPoints: [
          {
            label: "1. Sand Marks:",
            text: "Minor sand marks are normal in Sungudi cotton sarees, as the fabric is traditionally dried on river sand after dyeing.",
          },
          {
            label: "2. Handmade Nature:",
            text: "Minor smudges or irregularities are natural characteristics of handmade sarees and should not be considered stains or defects.",
          },
          {
            label: "3. Zari Line Marks:",
            text: "Zari line marks may occur during starching and ironing. These are not considered damage, as the marks are expected to relax after washing.",
          },
        ],
        callouts: [
          {
            type: "success",
            title: "Traditional Heritage",
            text: "Thank you for understanding and appreciating the beauty of traditional handmade Sungudi sarees.",
          },
        ],
      },
    ],
  },
};
