"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import type { SareeQuizAnswers } from "@/core/domain/entities/saree-quiz";

interface QuizStep {
  id: keyof SareeQuizAnswers;
  number: number;
  question: string;
  subtitle?: string;
  options: {
    label: string;
    description?: string;
  }[];
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: "bodyShape",
    number: 1,
    question: "Which body shape best describes you?",
    subtitle: "We celebrate every shape to suggest the most flattering, natural drape for you.",
    options: [
      { label: "Pear-shaped", description: "Hips wider than shoulders with a defined waist" },
      { label: "Apple-shaped", description: "Fuller midsection with slender arms and legs" },
      { label: "Hourglass-shaped", description: "Balanced bust and hips with a narrower waist" },
      { label: "Rectangle-shaped", description: "Bust, waist, and hips of relatively uniform width" },
      { label: "Oval or fuller-figured", description: "Generous curves with softer contours throughout" },
      { label: "Not sure", description: "Skip or choose later" },
    ],
  },
  {
    id: "height",
    number: 2,
    question: "What is your height?",
    subtitle: "Helps us recommend border proportions and drape styles tailored to your frame.",
    options: [
      { label: "Petite", description: "Under 5'3\" (160 cm)" },
      { label: "Average", description: "5'3\" to 5'7\" (160 - 170 cm)" },
      { label: "Tall", description: "Above 5'7\" (170 cm+)" },
    ],
  },
  {
    id: "undertone",
    number: 3,
    question: "What is your skin undertone?",
    subtitle: "Choose your best estimate to find colours and metallic accents that illuminate you.",
    options: [
      { label: "Warm — golden, peachy or yellowish", description: "Gold jewelry glows on you" },
      { label: "Cool — pinkish, rosy or bluish", description: "Silver and pearls complement you" },
      { label: "Neutral — a mix of warm and cool", description: "Both gold and silver flatter you easily" },
      { label: "I’m not sure", description: "We will curate versatile, universally flattering shades" },
    ],
  },
  {
    id: "occasion",
    number: 4,
    question: "What is the occasion?",
    subtitle: "Where will you be wearing your saree?",
    options: [
      { label: "Daily wear", description: "Comfortable, effortless elegance for day-to-day" },
      { label: "Office or formal wear", description: "Crisp, poised, and sophisticated drape" },
      { label: "Festive or family function", description: "Celebratory poojas, festive dinners, and gatherings" },
      { label: "Wedding or grand occasion", description: "Regal ceremonies, receptions, and milestone celebrations" },
    ],
  },
  {
    id: "style",
    number: 5,
    question: "Which style do you prefer?",
    subtitle: "Your personal aesthetic signature.",
    options: [
      { label: "Traditional and elegant", description: "Heritage weaves, authentic South Indian borders & timeless poise" },
      { label: "Modern and minimal", description: "Clean silhouettes, contemporary palette & subtle accents" },
      { label: "Rich and royal", description: "Intricate zari, opulent textures & statement glamour" },
      { label: "Simple and graceful", description: "Understated charm, breezy charm & organic texture" },
    ],
  },
  {
    id: "comfort",
    number: 6,
    question: "What matters most when choosing a saree?",
    subtitle: "How you want to feel while wrapped in nine yards of grace.",
    options: [
      { label: "Light and comfortable", description: "Featherlight, breathable & effortless movement all day" },
      { label: "Structured and crisp", description: "Neat pleats, defined fall & stays immaculate for hours" },
      { label: "Rich texture and luxurious feel", description: "Sumptuous silk weave, heavy zari fall & grand drape" },
      { label: "Versatile for many occasions", description: "Easy to dress up or down with jewellery changes" },
    ],
  },
  {
    id: "border",
    number: 7,
    question: "Which border do you love?",
    subtitle: "The border frames the entire drape.",
    options: [
      { label: "Grand zari border", description: "Broad, ornate antique gold or silver zari work" },
      { label: "Small or subtle border", description: "Delicate temple edge or sleek mini border" },
      { label: "Contrast colour border", description: "Eye-catching two-tone colour interplay" },
      { label: "Minimal or no prominent border", description: "Monochrome, modern, seamless elegance" },
    ],
  },
  {
    id: "colourPalette",
    number: 8,
    question: "Which colour palette attracts you?",
    subtitle: "The mood and shades you feel most magnetic in.",
    options: [
      { label: "Rich and vibrant — red, green, royal blue", description: "Vivid jewel tones with auspicious warmth" },
      { label: "Soft and pastel — blush, lavender, mint", description: "Dreamy, airy, delicate romantic hues" },
      { label: "Earthy and muted — beige, rust, olive", description: "Organic, sophisticated, nature-inspired tones" },
      { label: "Classic and timeless — black, cream, maroon", description: "Eternal, regal contrast and enduring dignity" },
    ],
  },
];

export function SareeQuizFlow() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SareeQuizAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = QUIZ_STEPS[currentStepIndex];
  const selectedAnswer = answers[currentStep.id];
  const progressPercent = Math.round(((currentStepIndex + 1) / QUIZ_STEPS.length) * 100);

  const handleSelectOption = (optionLabel: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentStep.id]: optionLabel,
    }));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Final submission
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Encode answers into URL search parameters for a refresh-safe, shareable results page
    const params = new URLSearchParams();
    if (answers.bodyShape) params.set("bodyShape", answers.bodyShape);
    if (answers.height) params.set("height", answers.height);
    if (answers.undertone) params.set("undertone", answers.undertone);
    if (answers.occasion) params.set("occasion", answers.occasion);
    if (answers.style) params.set("style", answers.style);
    if (answers.comfort) params.set("comfort", answers.comfort);
    if (answers.border) params.set("border", answers.border);
    if (answers.colourPalette) params.set("colourPalette", answers.colourPalette);

    router.push(`/quiz/results?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8 px-4">
      {/* Header & Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-[#694208] mb-2 tracking-wider uppercase">
          <span className="flex items-center gap-1.5 font-serif font-bold">
            <Sparkles className="h-3.5 w-3.5 text-[#073C35]" />
            Find Your Perfect Saree
          </span>
          <span className="font-sans font-semibold">
            Question {currentStep.number} of {QUIZ_STEPS.length}
          </span>
        </div>

        {/* Progress Bar with NiVi Brand Colors */}
        <div className="w-full h-2 bg-[#E9E1D2] rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-linear-to-r from-[#073C35] to-[#8C6D37] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[#FFFCF7] border border-[#E5DAC6] rounded-2xl p-6 sm:p-9 shadow-sm">
        <div className="mb-6">
          <span className="inline-block text-[11px] font-bold text-[#8C6D37] uppercase tracking-widest mb-1.5">
            Step {currentStep.number}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#221811] leading-snug">
            {currentStep.question}
          </h2>
          {currentStep.subtitle && (
            <p className="text-xs sm:text-sm text-[#5C4D3C] mt-1.5 leading-relaxed">
              {currentStep.subtitle}
            </p>
          )}
        </div>

        {/* Option Selection List */}
        <div className="space-y-3">
          {currentStep.options.map((opt) => {
            const isSelected = selectedAnswer === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelectOption(opt.label)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-[#073C35]/5 border-[#073C35] ring-1 ring-[#073C35] shadow-xs"
                    : "bg-white border-[#E5DAC6]/80 hover:border-[#8C6D37]/70 hover:bg-[#FFFAF0]"
                }`}
              >
                <div className="space-y-0.5">
                  <div
                    className={`text-sm sm:text-base font-medium ${
                      isSelected ? "text-[#073C35] font-semibold" : "text-[#221811]"
                    }`}
                  >
                    {opt.label}
                  </div>
                  {opt.description && (
                    <div className="text-xs text-[#6B5A4A]">{opt.description}</div>
                  )}
                </div>

                <div
                  className={`h-5 w-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-[#073C35] border-[#073C35] text-white"
                      : "border-[#C8BCAB] bg-white"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-[#E5DAC6]/60">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg border transition-all ${
              currentStepIndex === 0
                ? "invisible"
                : "border-[#D5CCBB] text-[#5C4D3C] hover:bg-[#F5EFE6] cursor-pointer"
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer ${
              !selectedAnswer || isSubmitting
                ? "bg-[#C8BCAB] text-white cursor-not-allowed opacity-60"
                : "bg-[#073C35] text-[#FAF7F0] hover:bg-[#073C35]/90 hover:shadow-lg active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <span>Curating your match...</span>
            ) : currentStepIndex === QUIZ_STEPS.length - 1 ? (
              <>
                <span>Find My Saree Style</span>
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
