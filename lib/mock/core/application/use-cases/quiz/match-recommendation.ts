import type {
  RecommendationProfile,
  SareeQuizAnswers,
} from "../../domain/entities/saree-quiz";
import { SAREE_QUIZ_RECOMMENDATIONS } from "@/data/saree-quiz-recommendations";

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

export function matchRecommendation(answers: SareeQuizAnswers, requestedIndex = 0): MatchResult {
  const scoredProfiles: { recommendation: RecommendationProfile; score: number }[] = [];

  for (const profile of SAREE_QUIZ_RECOMMENDATIONS) {
    let score = 0;
    if (answers.occasion && profile.primaryOccasions.includes(answers.occasion)) score += 30;
    if (answers.comfort && profile.primaryComforts.includes(answers.comfort)) score += 25;
    if (answers.style && profile.primaryStyles.includes(answers.style)) score += 20;
    if (answers.border && profile.primaryBorders.includes(answers.border)) score += 15;
    if (answers.colourPalette && profile.primaryPalettes.includes(answers.colourPalette)) score += 10;
    if (answers.height && profile.preferredHeight === answers.height) score += 5;
    scoredProfiles.push({ recommendation: profile, score });
  }

  scoredProfiles.sort((a, b) => b.score - a.score);

  const scoredPositive = scoredProfiles.filter((sp) => sp.score > 0);
  const eligibleMatches = scoredPositive.length > 0 ? scoredPositive : scoredProfiles.slice(0, 4);

  const safeIndex =
    ((requestedIndex % eligibleMatches.length) + eligibleMatches.length) % eligibleMatches.length;
  const current = eligibleMatches[safeIndex] || scoredProfiles[0];

  return {
    recommendation: current.recommendation,
    score: current.score,
    allMatches: eligibleMatches,
    matchIndex: safeIndex,
    totalMatches: eligibleMatches.length,
    personalizedAdvice: {
      drapingNote: "Keep front pleats even and allow the contrast pallu to fall freely over the shoulder.",
      jewelleryNote: "Traditional antique gold or pearls complement these handcrafted textures beautifully.",
    },
  };
}

