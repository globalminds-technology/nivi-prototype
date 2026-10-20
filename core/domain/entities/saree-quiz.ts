export type BodyShape =
  | "Pear-shaped"
  | "Apple-shaped"
  | "Hourglass-shaped"
  | "Rectangle-shaped"
  | "Oval or fuller-figured"
  | "Not sure";

export type HeightOption = "Petite" | "Average" | "Tall";

export type SkinUndertone =
  | "Warm — golden, peachy or yellowish"
  | "Cool — pinkish, rosy or bluish"
  | "Neutral — a mix of warm and cool"
  | "I’m not sure";

export type OccasionOption =
  | "Daily wear"
  | "Office or formal wear"
  | "Festive or family function"
  | "Wedding or grand occasion";

export type StyleOption =
  | "Traditional and elegant"
  | "Modern and minimal"
  | "Rich and royal"
  | "Simple and graceful";

export type ComfortOption =
  | "Light and comfortable"
  | "Structured and crisp"
  | "Rich texture and luxurious feel"
  | "Versatile for many occasions";

export type BorderOption =
  | "Grand zari border"
  | "Small or subtle border"
  | "Contrast colour border"
  | "Minimal or no prominent border";

export type ColourPaletteOption =
  | "Rich and vibrant — red, green, royal blue"
  | "Soft and pastel — blush, lavender, mint"
  | "Earthy and muted — beige, rust, olive"
  | "Classic and timeless — black, cream, maroon";

export interface SareeQuizAnswers {
  bodyShape?: BodyShape | null;
  height?: HeightOption | null;
  undertone?: SkinUndertone | null;
  occasion?: OccasionOption | null;
  style?: StyleOption | null;
  comfort?: ComfortOption | null;
  border?: BorderOption | null;
  colourPalette?: ColourPaletteOption | null;
}

export interface RecommendationProfile {
  id: string;
  slug: string;
  title: string;
  styleFocus?: string;
  fabric: string;
  occasions: string;
  styleSuggestion: string;
  whyItWorks: string;
  blouseRecommendation: string;
  drapingTip: string;
  jewelleryAndAccessories: string;
  colourGuidance: string;
  bannerImage: string | null;
  // Matching criteria weights
  primaryOccasions: OccasionOption[];
  primaryStyles: StyleOption[];
  primaryComforts: ComfortOption[];
  primaryBorders: BorderOption[];
  primaryPalettes: ColourPaletteOption[];
  preferredHeight?: HeightOption;
}
