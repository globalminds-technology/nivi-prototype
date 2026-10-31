"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
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
    id: "height",
    number: 1,
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
    number: 2,
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
    number: 3,
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
    number: 4,
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
    number: 5,
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
    number: 6,
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
    number: 7,
    question: "Which colour palette attracts you?",
    subtitle: "The mood and shades you feel most magnetic in.",
    options: [
      { label: "Rich and vibrant — red, green, royal blue", description: "Vivid jewel tones with auspicious warmth" },
      { label: "Soft and pastel — blush, lavender, mint", description: "Dreamy, airy, delicate romantic hues" },
      { label: "Earthy and muted — beige, rust, olive", description: "Organic, sophisticated, nature-inspired tones" },
      { label: "Classic and timeless — black, cream, maroon", description: "Eternal, regal contrast and enduring dignity" },
    ],
  },
  {
    id: "bodyShape",
    number: 8,
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
];

export function SareeQuizFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams ? searchParams.get("mode") === "edit" : false;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SareeQuizAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever navigating to the quiz or search parameters change
  useEffect(() => {
    setIsSubmitting(false);

    if (isEditMode && searchParams) {
      const initial: SareeQuizAnswers = {};
      const bodyShape = searchParams.get("bodyShape");
      const height = searchParams.get("height");
      const undertone = searchParams.get("undertone");
      const occasion = searchParams.get("occasion");
      const style = searchParams.get("style");
      const comfort = searchParams.get("comfort");
      const border = searchParams.get("border");
      const colourPalette = searchParams.get("colourPalette");

      if (bodyShape) initial.bodyShape = bodyShape as any;
      if (height) initial.height = height as any;
      if (undertone) initial.undertone = undertone as any;
      if (occasion) initial.occasion = occasion as any;
      if (style) initial.style = style as any;
      if (comfort) initial.comfort = comfort as any;
      if (border) initial.border = border as any;
      if (colourPalette) initial.colourPalette = colourPalette as any;

      setAnswers(initial);
      setCurrentStepIndex(0);
    } else {
      // Fresh start from Question 1 with cleared answers
      setCurrentStepIndex(0);
      setAnswers({});
    }
  }, [searchParams, isEditMode]);

  // Handle browser Back/Forward Cache (BFCache) when navigating back from results
  useEffect(() => {
    const handlePageShow = () => {
      setIsSubmitting(false);
      if (!searchParams || searchParams.get("mode") !== "edit") {
        setCurrentStepIndex(0);
        setAnswers({});
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [searchParams]);

  // Safety cleanup: reset isSubmitting on unmount
  useEffect(() => {
    return () => {
      setIsSubmitting(false);
    };
  }, []);

  const currentStep = QUIZ_STEPS[currentStepIndex];
  const selectedAnswer = answers[currentStep.id];
  const progressPercent = Math.round(((currentStepIndex + 1) / QUIZ_STEPS.length) * 100);

  const handleSubmit = (finalAnswers: SareeQuizAnswers) => {
    setIsSubmitting(true);
    // Encode answers into URL search parameters for a refresh-safe, shareable results page
    const params = new URLSearchParams();
    if (finalAnswers.bodyShape) params.set("bodyShape", finalAnswers.bodyShape);
    if (finalAnswers.height) params.set("height", finalAnswers.height);
    if (finalAnswers.undertone) params.set("undertone", finalAnswers.undertone);
    if (finalAnswers.occasion) params.set("occasion", finalAnswers.occasion);
    if (finalAnswers.style) params.set("style", finalAnswers.style);
    if (finalAnswers.comfort) params.set("comfort", finalAnswers.comfort);
    if (finalAnswers.border) params.set("border", finalAnswers.border);
    if (finalAnswers.colourPalette) params.set("colourPalette", finalAnswers.colourPalette);

    router.push(`/quiz/results?${params.toString()}`);

    // Safety timeout in case navigation is delayed or preserved in router cache
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSelectOption = (optionLabel: string) => {
    if (isSubmitting) return;

    setAnswers((prev) => ({
      ...prev,
      [currentStep.id]: optionLabel,
    }));
  };

  const handleNext = () => {
    if (!selectedAnswer || isSubmitting) return;

    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSubmit(answers);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0 && !isSubmitting) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setAnswers({});
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4">
      {/* Question Card (Compact, Fits Entirely in Viewport) */}
      <div className="bg-[#FFFCF7] border border-[#D5CCBB] rounded-2xl p-4 sm:p-7 shadow-[0_8px_30px_rgba(78,52,24,0.04)]">
        {/* Card Header & Progress Bar */}
        <div className="space-y-3 mb-4 sm:mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#694208]">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#8C6D37]">
              Step {currentStep.number} of {QUIZ_STEPS.length}
            </span>
            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1 text-[11px] text-[#8C6D37] hover:text-[#073C35] transition-colors cursor-pointer"
                  title="Restart from Question 1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Restart</span>
                </button>
              )}
              <span className="text-[11px] font-mono font-semibold text-[#6B5A4A]">
                {progressPercent}% Complete
              </span>
            </div>
          </div>

          {/* Progress Bar with NiVi Brand Colors */}
          <div className="w-full h-1.5 bg-[#E9E1D2] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-[#073C35] to-[#8C6D37] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Title & Subtitle */}
          <div className="pt-1">
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-[#221811] leading-snug">
              {currentStep.question}
            </h2>
            {currentStep.subtitle && (
              <p className="text-xs sm:text-xs text-[#6B5A4A] mt-1 leading-relaxed">
                {currentStep.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Options Grid (Dual Column on Desktop, Single on Mobile for Scannability) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {currentStep.options.map((option) => {
            const isSelected = selectedAnswer === option.label;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => handleSelectOption(option.label)}
                disabled={isSubmitting}
                className={`group relative flex items-start justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#073C35] bg-[#073C35]/5 ring-1 ring-[#073C35] shadow-xs"
                    : "border-[#D5CCBB] bg-white hover:border-[#8C6D37]/50 hover:bg-[#FAF6EE]/50"
                }`}
              >
                <div className="pr-3 space-y-0.5">
                  <p
                    className={`text-xs sm:text-sm font-semibold transition-colors ${
                      isSelected ? "text-[#073C35]" : "text-[#221811] group-hover:text-[#073C35]"
                    }`}
                  >
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-[11px] sm:text-xs text-[#6B5A4A] leading-snug">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Elegant Radio/Check Icon */}
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? "bg-[#073C35] text-white shadow-2xs"
                      : "border border-[#C8BCAB] bg-white group-hover:border-[#8C6D37]"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Navigation (Explicit Next Navigation) */}
        <div className="flex items-center justify-between pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-[#E5DAC6]/60">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
              currentStepIndex === 0
                ? "invisible"
                : "border-[#D5CCBB] text-[#5C4D3C] hover:bg-[#FAF4EA] cursor-pointer"
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] text-[#8C6D37] hidden xs:inline font-medium">
            {!selectedAnswer ? "Select an option to continue" : "Choice recorded"}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer ${
              !selectedAnswer || isSubmitting
                ? "bg-[#C8BCAB] text-white cursor-not-allowed opacity-50"
                : "bg-[#073C35] text-[#FAF7F0] hover:bg-[#073C35]/90 hover:shadow-lg active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <span>Curating match...</span>
            ) : currentStepIndex === QUIZ_STEPS.length - 1 ? (
              <>
                <span>View My Saree Match</span>
                <ArrowRight className="h-4 w-4 text-[#C9A45C]" />
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
