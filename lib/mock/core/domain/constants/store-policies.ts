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
    summary: "Orders processed after confirmation. Dispatched within 2-3 business days with tracking updates sent directly to your phone/email.",
    content: [
      {
        heading: "Shipping Policy",
        bulletPoints: [
          { text: "Orders are processed promptly upon order confirmation." },
          { text: "Orders are shipped through premium insured logistics partners across India." },
          { text: "Delivery timelines may vary depending on destination pin code and courier logistics." },
          { text: "Real-time tracking details will be shared once your parcel is dispatched." },
          { text: "Standard domestic delivery completes within 4-7 business days." },
        ],
        paragraphs: [
          "Orders are typically processed and dispatched within 2-3 business days, excluding Sundays and national holidays.",
        ],
      },
    ],
  },
  returns: {
    id: "returns",
    title: "Return & Exchange Policy",
    badge: "Quality Guarantee",
    iconName: "RotateCcw",
    summary: "Dedicated support for damaged or incorrect deliveries. Clear unboxing verification ensures seamless replacements.",
    content: [
      {
        heading: "Return & Exchange Policy",
        paragraphs: [
          "Every saree at The Saree Studio is thoroughly inspected and carefully packed before dispatch.",
        ],
        callouts: [
          {
            type: "info",
            title: "Handloom Craft Notice",
            text: "A 5–10% subtle colour nuance may occur due to photography lighting, screen resolutions, and artisanal dye-lots. Such organic variations celebrate genuine handcrafted textiles.",
          },
        ],
      },
      {
        heading: "Returns Accepted For:",
        bulletPoints: [
          { text: "Incorrect product received" },
          { text: "Damaged product in transit" },
        ],
      },
    ],
  },
  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    badge: "Standard Policy",
    iconName: "XCircle",
    summary: "Cancellations are accepted before dispatch. Please verify order details carefully before checkout.",
    content: [
      {
        heading: "Cancellation Policy",
        bulletPoints: [
          { text: "Cancellations can be requested before your order is dispatched." },
          { text: "Please review your selected saree, colour, and delivery address during checkout." },
        ],
      },
    ],
  },
  disclaimers: {
    id: "disclaimers",
    title: "Product & Craft Disclaimers",
    badge: "Handloom Heritage",
    iconName: "Info",
    summary: "Authentic handloom silk, zari weaves, and traditional artisan textile characteristics.",
    content: [
      {
        heading: "AUTHENTIC HANDLOOM SAREES – CRAFT DISCLAIMER",
        bulletPoints: [
          {
            label: "1. Handloom Characteristics:",
            text: "Subtle organic irregularities in weaving, slubs, and thread textures are the hallmark of authentic handloom heritage.",
          },
          {
            label: "2. Pure Zari & Weave:",
            text: "Artisanal border alignments and zari motifs are hand-guided by master weavers.",
          },
          {
            label: "3. Care Instructions:",
            text: "Dry clean only recommended for pure silk and zari sarees to preserve textile luster and longevity.",
          },
        ],
      },
    ],
  },
};

