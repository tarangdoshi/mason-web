"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PackagePlanContent, RiskQuizBand, RiskQuizQuestionContent, RiskQuizSectionContent } from "../../content/types";
import { getPackageCodeFromName } from "../../lib/crm-contract";
import { clearQuizContext, storeLeadCtaContext, storeQuizContext } from "../../lib/lead-context";
import styles from "./risk-quiz.module.css";

type RiskQuizProps = {
  section: RiskQuizSectionContent;
  packagesSectionId?: string;
  fallbackPlan?: PackagePlanContent["name"];
};

type QuizPhase = "intro" | "quiz" | "result";

const DEFAULT_STICKY_OFFSET_PX = 102;

function resolveStickyOffsetPx() {
  if (typeof window === "undefined") {
    return DEFAULT_STICKY_OFFSET_PX;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const rawOffset = rootStyles.getPropertyValue("--sticky-nav-offset").trim();
  if (!rawOffset) {
    return DEFAULT_STICKY_OFFSET_PX;
  }

  const numeric = Number.parseFloat(rawOffset);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_STICKY_OFFSET_PX;
  }

  if (rawOffset.endsWith("px")) {
    return numeric;
  }

  if (rawOffset.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(rootStyles.fontSize);
    if (Number.isFinite(rootFontSize)) {
      return numeric * rootFontSize;
    }
  }

  return numeric;
}

function clampScore(score: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, score));
}

function getBandClass(band: RiskQuizBand) {
  const label = band.label.toLowerCase();
  if (label.includes("high")) {
    return styles.badgeHigh;
  }
  if (label.includes("moderate")) {
    return styles.badgeModerate;
  }
  return styles.badgeLow;
}

export default function RiskQuiz({ section, packagesSectionId = "packages", fallbackPlan = "Comfort" }: RiskQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const highlightTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const questionCount = section.questions.length;
  const currentQuestion = section.questions[questionIndex];

  const score = useMemo(() => {
    const rawScore = section.questions.reduce((sum, question) => {
      const optionId = answers[question.id];
      if (!optionId) {
        return sum;
      }
      const option = question.options.find((item) => item.id === optionId);
      return sum + (option?.score ?? 0);
    }, 0);
    return clampScore(rawScore);
  }, [answers, section.questions]);

  const resolvedBand = useMemo(() => {
    const band = section.bands.find((item) => score >= item.min && score <= item.max);
    if (band) {
      return band;
    }
    if (fallbackPlan) {
      return section.bands.find((item) => item.recommendedPlan === fallbackPlan) ?? section.bands[0];
    }
    return section.bands[0];
  }, [fallbackPlan, score, section.bands]);

  const recommendedPlan = resolvedBand?.recommendedPlan ?? fallbackPlan;

  const clearRecommendedHighlights = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const cards = document.querySelectorAll<HTMLElement>("[data-recommended='true']");
    cards.forEach((card) => {
      card.removeAttribute("data-recommended");
    });
  }, []);

  const highlightRecommendedPlan = useCallback(
    (planName: PackagePlanContent["name"]) => {
      if (typeof document === "undefined") {
        return;
      }

      clearRecommendedHighlights();
      const target = document.querySelector<HTMLElement>(`[data-plan-name="${planName}"]`);
      if (!target) {
        return;
      }

      target.setAttribute("data-recommended", "true");
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        target.removeAttribute("data-recommended");
        highlightTimerRef.current = null;
      }, 2600);
    },
    [clearRecommendedHighlights]
  );

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!Object.keys(answers).length) {
      return;
    }

    storeQuizContext({
      quizScore: score,
      quizBandId: resolvedBand.id,
      quizBandLabel: resolvedBand.label,
      recommendedPackageCode: getPackageCodeFromName(recommendedPlan),
      recommendedPackageName: recommendedPlan,
      quizAnswers: answers
    });
  }, [answers, recommendedPlan, resolvedBand.id, resolvedBand.label, score]);

  const onSelectAnswer = useCallback(
    (question: RiskQuizQuestionContent, optionId: string) => {
      setAnswers((previous) => ({ ...previous, [question.id]: optionId }));

      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }

      advanceTimerRef.current = window.setTimeout(() => {
        if (questionIndex === questionCount - 1) {
          setPhase("result");
          return;
        }
        setQuestionIndex((value) => Math.min(value + 1, questionCount - 1));
      }, 200);
    },
    [questionCount, questionIndex]
  );

  const onStart = useCallback(() => {
    setPhase("quiz");
    setQuestionIndex(0);
  }, []);

  const onRestart = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setAnswers({});
    setQuestionIndex(0);
    setPhase("quiz");
    clearRecommendedHighlights();
    clearQuizContext();
  }, [clearRecommendedHighlights]);

  const onSeeRecommendation = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    storeLeadCtaContext({
      entryPoint: "risk-quiz-result",
      pageSection: section.id,
      ctaId: "see-recommended-package",
      packageCode: getPackageCodeFromName(recommendedPlan) ?? undefined,
      packageName: recommendedPlan
    });

    const targetSection = document.getElementById(packagesSectionId);
    if (targetSection) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stickyOffset = resolveStickyOffsetPx();
      const targetY = Math.max(0, window.scrollY + targetSection.getBoundingClientRect().top - stickyOffset);
      window.scrollTo({
        top: targetY,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
      if (window.location.hash !== `#${packagesSectionId}`) {
        window.history.replaceState(null, "", `#${packagesSectionId}`);
      }
    }

    highlightRecommendedPlan(recommendedPlan);
  }, [highlightRecommendedPlan, packagesSectionId, recommendedPlan, section.id]);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Risk Quiz</p>
        <h3>Quick safety fit check</h3>
        <p>{section.intro}</p>
      </header>

      {phase === "intro" ? (
        <div className={styles.intro}>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={onStart}>
            {section.startLabel}
          </button>
        </div>
      ) : null}

      {phase === "quiz" && currentQuestion ? (
        <div className={styles.flow}>
          <p className={styles.progress}>
            Question {questionIndex + 1} of {questionCount}
          </p>
          <h4>{currentQuestion.prompt}</h4>
          <div className={styles.options} role="radiogroup" aria-label={currentQuestion.prompt}>
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.option}${isSelected ? ` ${styles.optionSelected}` : ""}`}
                  onClick={() => onSelectAnswer(currentQuestion, option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className={styles.helperText}>Tap once and the next question will appear automatically.</p>
        </div>
      ) : null}

      {phase === "result" && resolvedBand ? (
        <section className={styles.result} aria-live="polite">
          <p className={`${styles.badge} ${getBandClass(resolvedBand)}`}>{resolvedBand.label} Risk</p>
          <p className={styles.score}>{score}/100</p>
          <p className={styles.summary}>{resolvedBand.summary}</p>
          <p className={styles.recommendation}>
            Recommended package: <strong>{recommendedPlan}</strong>
          </p>
          <p className={styles.resultNote}>This is a guide, not a final recommendation. Mason can confirm the safest fit during your free assessment.</p>
          <div className={styles.actions}>
            <a
              href="/#free-assessment"
              className={`${styles.button} ${styles.buttonPrimary}`}
              data-analytics-event="homepage_cta_click"
              data-analytics-cta-location="risk-quiz-result-primary"
              data-analytics-section={section.id}
            >
              Book Free Safety Assessment
            </a>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onSeeRecommendation}>
              {section.resultCtaLabel}
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onRestart}>
              {section.restartLabel}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
