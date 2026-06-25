"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type BeforeAfterSliderProps = {
  beforeImage?: string;
  afterImage?: string;
  beforeImageMobile?: string;
  beforeImageDesktop?: string;
  afterImageMobile?: string;
  afterImageDesktop?: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  autoplayMs?: number;
  fallbackImage: string;
  fallbackAlt: string;
  loading?: "eager" | "lazy";
};

const DEFAULT_AUTOPLAY_MS = 5500;
const MIN_SPLIT_PERCENT = 0;
const MAX_SPLIT_PERCENT = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeImageMobile,
  beforeImageDesktop,
  afterImageMobile,
  afterImageDesktop,
  beforeAlt,
  afterAlt,
  beforeLabel = "Before",
  afterLabel = "After",
  autoplayMs = DEFAULT_AUTOPLAY_MS,
  fallbackImage,
  fallbackAlt,
  loading = "lazy"
}: BeforeAfterSliderProps) {
  const [splitPercent, setSplitPercent] = useState(MIN_SPLIT_PERCENT);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const splitPercentRef = useRef(splitPercent);
  const resolvedBeforeImage = beforeImage || beforeImageDesktop || beforeImageMobile;
  const resolvedAfterImage = afterImage || afterImageDesktop || afterImageMobile;
  const hasImages = Boolean(resolvedBeforeImage && resolvedAfterImage);
  const hasDistinctImages = hasImages && resolvedBeforeImage !== resolvedAfterImage;
  const shouldPauseAutoplay = isPointerDragging || isHovered || isFocused;

  function setSplitFromClientX(clientX: number) {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }
    const bounds = slider.getBoundingClientRect();
    if (bounds.width <= 0) {
      return;
    }
    const rawPercent = ((clientX - bounds.left) / bounds.width) * 100;
    setSplitPercent(clamp(rawPercent, MIN_SPLIT_PERCENT, MAX_SPLIT_PERCENT));
  }

  function endPointerDrag(pointerId?: number) {
    const slider = sliderRef.current;
    if (slider && typeof pointerId === "number") {
      try {
        slider.releasePointerCapture(pointerId);
      } catch {
        // Safe no-op when capture was not active.
      }
    }
    activePointerIdRef.current = null;
    setIsPointerDragging(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }
    activePointerIdRef.current = event.pointerId;
    slider.setPointerCapture(event.pointerId);
    slider.focus();
    setIsPointerDragging(true);
    setSplitFromClientX(event.clientX);
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isPointerDragging || activePointerIdRef.current !== event.pointerId) {
      return;
    }
    setSplitFromClientX(event.clientX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }
    setSplitFromClientX(event.clientX);
    endPointerDrag(event.pointerId);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }
    endPointerDrag(event.pointerId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasDistinctImages) {
      return;
    }
    const nudgePercent = 3;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSplitPercent((value) => clamp(value - nudgePercent, MIN_SPLIT_PERCENT, MAX_SPLIT_PERCENT));
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSplitPercent((value) => clamp(value + nudgePercent, MIN_SPLIT_PERCENT, MAX_SPLIT_PERCENT));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setSplitPercent(MIN_SPLIT_PERCENT);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setSplitPercent(MAX_SPLIT_PERCENT);
    }
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    splitPercentRef.current = splitPercent;
  }, [splitPercent]);

  useEffect(() => {
    if (!hasDistinctImages || reducedMotion) {
      setSplitPercent(50);
      return;
    }
    if (shouldPauseAutoplay) {
      return;
    }

    const stepMs = Math.max(2200, Math.round(autoplayMs / 2));
    const midpoint = (MIN_SPLIT_PERCENT + MAX_SPLIT_PERCENT) / 2;
    let towardsAfter = splitPercentRef.current <= midpoint;
    const kickoff = window.setTimeout(() => {
      setSplitPercent(towardsAfter ? MAX_SPLIT_PERCENT : MIN_SPLIT_PERCENT);
      towardsAfter = !towardsAfter;
    }, 90);

    const intervalId = window.setInterval(() => {
      setSplitPercent(towardsAfter ? MAX_SPLIT_PERCENT : MIN_SPLIT_PERCENT);
      towardsAfter = !towardsAfter;
    }, stepMs);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(intervalId);
    };
  }, [autoplayMs, hasDistinctImages, reducedMotion, shouldPauseAutoplay]);

  useEffect(() => {
    if (!hasImages || hasDistinctImages) {
      return;
    }
    console.warn("[Mason Company] Before/After slider received identical image paths; autoplay disabled for this render.");
  }, [hasDistinctImages, hasImages]);

  if (!hasImages) {
    return <img src={fallbackImage} alt={fallbackAlt} width={1200} height={900} loading={loading} decoding="async" className="heroVisualImage" />;
  }

  const transitionMs = isPointerDragging ? 0 : Math.max(1800, Math.round((autoplayMs || DEFAULT_AUTOPLAY_MS) / 2) - 260);

  return (
    <div
      ref={sliderRef}
      className={`beforeAfterSlider sliderSurface${isPointerDragging ? " isDragging" : ""}`}
      tabIndex={0}
      role="slider"
      aria-label={`${beforeLabel} and ${afterLabel} bathroom comparison slider`}
      aria-valuemin={MIN_SPLIT_PERCENT}
      aria-valuemax={MAX_SPLIT_PERCENT}
      aria-valuenow={Math.round(splitPercent)}
      aria-valuetext={`${Math.round(splitPercent)} percent`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="sliderViewport">
        <picture>
          {beforeImageMobile ? <source media="(max-width: 767px)" srcSet={beforeImageMobile} /> : null}
          {beforeImageDesktop ? <source media="(min-width: 768px)" srcSet={beforeImageDesktop} /> : null}
          <img
            src={resolvedBeforeImage}
            alt={beforeAlt || fallbackAlt}
            width={1200}
            height={900}
            sizes="(max-width: 767px) 100vw, 588px"
            loading={loading}
            decoding="async"
            className="beforeLayer"
          />
        </picture>
        <div
          className="afterLayer"
          style={{
            left: `${splitPercent}%`,
            width: `calc(100% - ${splitPercent}%)`,
            transitionDuration: `${transitionMs}ms`
          }}
        >
          <picture>
            {afterImageMobile ? <source media="(max-width: 767px)" srcSet={afterImageMobile} /> : null}
            {afterImageDesktop ? <source media="(min-width: 768px)" srcSet={afterImageDesktop} /> : null}
            <img
              src={resolvedAfterImage}
              alt={afterAlt || fallbackAlt}
              width={1200}
              height={900}
              sizes="(max-width: 767px) 100vw, 588px"
              loading={loading}
              decoding="async"
              className="afterLayerImage"
            />
          </picture>
        </div>
      </div>
      <span className="splitHandle" style={{ left: `${splitPercent}%`, transitionDuration: `${transitionMs}ms` }} aria-hidden="true" />
      <span className="beforeTag">{beforeLabel}</span>
      <span className="afterTag">{afterLabel}</span>
    </div>
  );
}
