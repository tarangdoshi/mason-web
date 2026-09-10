"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** vertical travel in px */
  y?: number;
  /** delay between children marked with .reveal */
  stagger?: number;
  /** ScrollTrigger start */
  start?: string;
  as?: React.ElementType;
};

/**
 * Wraps a section and animates any descendant with the `reveal` class
 * into view on scroll (fade + rise), staggered.
 */
export default function Reveal({
  children,
  className,
  y = 26,
  stagger = 0.09,
  start = "top 84%",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(".reveal", ref.current);
      if (!targets.length) return;

      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start, once: true },
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
