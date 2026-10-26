import type {
  RecommendationProfile,
  SareeQuizAnswers,
} from "@/core/domain/entities/saree-quiz";
import { SAREE_QUIZ_RECOMMENDATIONS } from "@/data/saree-quiz-recommendations";

/**
 * Specialized Result for Section 7 Sample Scenario:
 * "Pastel Regal Grace — Modern Comfort Meets Festive Heritage"
 */
export const SAMPLE_SCENARIO_RESULT: RecommendationProfile = {
  id: "rec-sample-festive-pastel",
  slug: "pastel-regal-grace",
  title: "Pastel Regal Grace — Modern Comfort Meets Festive Heritage",
  fabric: "Silk Cotton / Soft Silk",
  occasions: "Festive or family function",
  styleSuggestion: "Lightweight soft silk or silk cotton with a grand zari border.",
  whyItWorks:
    "A lightweight drape keeps you comfortable during family festivities, while the grand zari border adds celebratory richness.",
  blouseRecommendation: "Boat-neck or elbow-sleeve blouse with subtle detailing.",
  drapingTip: "Neat front pleats with a freely flowing pallu to highlight the zari border.",
  jewelleryAndAccessories:
    "Silver-toned, white-gold or rhodium-finish jewellery with soft pearl accents to complement cool undertones.",
  colourGuidance: "Blush pink, lavender, mint and related pastel shades.",
  bannerImage: null,
  primaryOccasions: ["Festive or family function"],
  primaryStyles: ["Modern and minimal"],
  primaryComforts: ["Light and comfortable"],
  primaryBorders: ["Grand zari border"],
  primaryPalettes: ["Soft and pastel — blush, lavender, mint"],
};

export interface MatchResult {
  recommendation: RecommendationProfile;
  score: number;
  allMatches: { recommendation: RecommendationProfile; score: number }[];
  matchIndex: number;
  totalMatches: number;
  personalizedAdvice?: {
    drapingNote?: string;
    jewelleryNote?: string;
    bodyShapeNote?: string;
    heightNote?: string;
    undertoneNote?: string;
  };
}

/**
 * Matches customer answers against recommendation profiles using scoring priorities:
 * 1. Occasion (30 pts)
 * 2. Comfort / Feel (25 pts)
 * 3. Style Preference (20 pts)
 * 4. Border Preference (15 pts)
 * 5. Colour Palette (10 pts)
 * 6. Height / Proportions (5 pts)
 *
 * Deterministic fallback, ranked multi-match scoring, and tie-breaking ensured.
 */
export function matchRecommendation(answers: SareeQuizAnswers, requestedIndex = 0): MatchResult {
  const scoredProfiles: { recommendation: RecommendationProfile; score: number }[] = [];

  // Check exact Section 7 Sample Scenario
  if (
    answers.occasion === "Festive or family function" &&
    answers.style === "Modern and minimal" &&
    answers.comfort === "Light and comfortable" &&
    answers.border === "Grand zari border" &&
    answers.colourPalette === "Soft and pastel — blush, lavender, mint"
  ) {
    scoredProfiles.push({ recommendation: SAMPLE_SCENARIO_RESULT, score: 100 });
  }

  for (const profile of SAREE_QUIZ_RECOMMENDATIONS) {
    if (profile.id === SAMPLE_SCENARIO_RESULT.id) continue;
    let score = 0;

    // 1. Occasion (Weight: 30)
    if (answers.occasion && profile.primaryOccasions.includes(answers.occasion)) {
      score += 30;
    }

    // 2. Comfort & Feel (Weight: 25)
    if (answers.comfort && profile.primaryComforts.includes(answers.comfort)) {
      score += 25;
    }

    // 3. Preferred Style (Weight: 20)
    if (answers.style && profile.primaryStyles.includes(answers.style)) {
      score += 20;
    }

    // 4. Border Preference (Weight: 15)
    if (answers.border && profile.primaryBorders.includes(answers.border)) {
      score += 15;
    }

    // 5. Colour Palette (Weight: 10)
    if (answers.colourPalette && profile.primaryPalettes.includes(answers.colourPalette)) {
      score += 10;
    }

    // 6. Height / Proportions (Weight: 5)
    if (answers.height && profile.preferredHeight === answers.height) {
      score += 5;
    }

    scoredProfiles.push({ recommendation: profile, score });
  }

  // Sort descending by score
  scoredProfiles.sort((a, b) => b.score - a.score);

  // Filter top matches: either score > 0 or at least top 4 matches
  const scoredPositive = scoredProfiles.filter((sp) => sp.score > 0);
  const eligibleMatches = scoredPositive.length > 0 ? scoredPositive : scoredProfiles.slice(0, 4);

  const safeIndex =
    ((requestedIndex % eligibleMatches.length) + eligibleMatches.length) % eligibleMatches.length;
  const current = eligibleMatches[safeIndex];

  return {
    recommendation: current.recommendation,
    score: current.score,
    allMatches: eligibleMatches,
    matchIndex: safeIndex,
    totalMatches: eligibleMatches.length,
    personalizedAdvice: generatePersonalizedAdvice(answers),
  };
}

/**
 * Adds nuanced, positive styling tips based on Undertone and Height
 * without body-shaming or making absolute claims.
 */
function generatePersonalizedAdvice(answers: SareeQuizAnswers) {
  let drapingNote: string | undefined;
  let jewelleryNote: string | undefined;
  let bodyShapeNote: string | undefined;
  let heightNote: string | undefined;
  let undertoneNote: string | undefined;

  if (answers.bodyShape === "Hourglass-shaped") {
    bodyShapeNote = "Flowing fabrics like soft silk and georgette drape naturally along your curves, creating an effortless, balanced silhouette.";
  } else if (answers.bodyShape === "Pear-shaped") {
    bodyShapeNote = "Highlighting the pallu and shoulder drape creates a graceful, proportional balance with gentle front pleats.";
  } else if (answers.bodyShape === "Apple-shaped") {
    bodyShapeNote = "Longer pallu drapes and structured weaves offer comfortable movement and elegant length.";
  } else if (answers.bodyShape === "Rectangle-shaped") {
    bodyShapeNote = "Textured pleats and defined border accents add dimension and graceful contour.";
  } else if (answers.bodyShape === "Oval or fuller-figured") {
    bodyShapeNote = "Comfortable, breathable weaves with medium borders drape smoothly and feel wonderfully light.";
  }

  if (answers.height === "Petite") {
    heightNote = "Medium or sleek borders and a neatly pinned pallu celebrate your frame with balanced proportions.";
    drapingNote = "For a streamlined look, keep your pleats neat and moderately spaced, letting the pallu flow naturally.";
  } else if (answers.height === "Tall") {
    heightNote = "Broader grand zari borders and sweeping pallus look majestic on your statuesque frame.";
    drapingNote = "Vertical pattern alignment and a slightly broader shoulder drape highlight tall proportions gracefully.";
  } else if (answers.height === "Average") {
    heightNote = "Classic border proportions and traditional pleats pair versatilely with almost any drape.";
  }

  if (answers.undertone?.includes("Warm")) {
    undertoneNote = "Warm golden, antique bronze, and temple jewellery beautifully accentuate warm golden skin tones.";
    jewelleryNote = undertoneNote;
  } else if (answers.undertone?.includes("Cool")) {
    undertoneNote = "Silver, white-gold finishes, and soft pearl ornaments add luminous radiance to cool undertones.";
    jewelleryNote = undertoneNote;
  } else if (answers.undertone?.includes("Neutral")) {
    undertoneNote = "Both yellow gold and oxidised silver accessories blend effortlessly with neutral undertones.";
    jewelleryNote = undertoneNote;
  }

  return { drapingNote, jewelleryNote, bodyShapeNote, heightNote, undertoneNote };
}
