"use client";

import Image from "next/image";
import { useEditProps } from "./EditModeProvider";
import { DOCS } from "@/lib/cms/edit";
import { useRef, useState } from "react";
import Reveal from "./Reveal";
import HighlightedText from "./HighlightedText";
import type { CmsImage, HomeContent } from "@/lib/cms/model";

function BeforeAfter({ before, after }: { before: CmsImage; after: CmsImage }) {
  const [pos, setPos] = useState(52);
  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false });
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  const track = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Compare bathroom before and after"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        setPos((current) => event.key === "Home" ? 0 : event.key === "End" ? 100 : Math.max(0, Math.min(100, current + (event.key === "ArrowRight" ? 5 : -5))));
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        el(e).setPointerCapture(e.pointerId);
        // Jump the divider to the press point for a mouse, where a click is a
        // deliberate "put it here". A touch that lands here may well be the
        // start of a scroll, and yanking the divider under the finger before
        // the gesture has declared itself is the wrong guess to make.
        if (e.pointerType !== "touch") move(e.clientX);
      }}
      onPointerMove={(e) => {
        track(e);
        if (dragging.current) move(e.clientX);
      }}
      onPointerEnter={track}
      onPointerLeave={() => setCursor((c) => ({ ...c, show: false }))}
      onPointerUp={() => (dragging.current = false)}
      /* The browser cancels our pointer when it claims the gesture as a page
         scroll. Without this the flag stays true, and the next finger anywhere
         on the image drags the divider without being asked to. */
      onPointerCancel={() => (dragging.current = false)}
      /* touch-pan-y is the whole fix for the page moving under the drag. With
         touch-action unset the browser owns every direction, so sliding the
         divider sideways scrolled the page at the same time. pan-y hands it
         back the vertical axis only: a swipe up or down over the image still
         scrolls the page, a sideways drag is ours alone. */
      className="relative aspect-[16/9] w-full touch-pan-y cursor-ew-resize select-none overflow-hidden rounded-2xl border border-line lg:aspect-auto lg:h-full lg:cursor-none"
    >
      {/* custom drag cursor (desktop) */}
      <div
        className="pointer-events-none absolute z-30 hidden -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 lg:block"
        style={{ left: cursor.x, top: cursor.y, opacity: cursor.show ? 1 : 0 }}
      >
        <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 7l-4 5 4 5M15 7l4 5-4 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Drag
        </span>
      </div>
      {/* after (color) */}
      <Image
        src={after.src}
        alt={after.alt}
        fill
        draggable={false}
        sizes="(max-width: 1024px) 100vw, 66vw"
        className="object-cover"
        priority
      />
      <span className="absolute bottom-4 right-4 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
        After
      </span>

      {/* before (grayscale), clipped via clip-path so the image never squashes */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={before.src}
          alt={before.alt}
          fill
          draggable={false}
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover grayscale brightness-[0.7]"
        />
        <span className="absolute bottom-4 left-4 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-cream">
          Before
        </span>
      </div>

      {/* handle */}
      <div
        className="absolute inset-y-0 z-10 flex w-0 items-center justify-center"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute inset-y-0 w-px bg-white/85" />
        <div className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white/95 shadow-sm backdrop-blur">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 7l-4 5 4 5M15 7l4 5-4 5"
              stroke="#1a1a18"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// tiny helper to keep the pointer-capture call tidy
function el(e: React.PointerEvent) {
  return e.currentTarget as HTMLElement;
}

// One finished-bathroom tile. The frame ratio is passed in per position so the
// mosaic keeps its varied, masonry rhythm instead of a uniform grid.
function Tile({
  img,
  label,
  alt,
  className,
  sizes,
}: {
  img: string;
  label: string;
  alt: string;
  className: string;
  sizes: string;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-2xl border border-line ${className}`}
    >
      <Image
        src={img}
        alt={alt || label}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

export default function Transformations({ content }: { content: HomeContent["transformations"] }) {
  const edit = useEditProps(DOCS.gallery);
  return (
    <section
      id="transformations"
      {...edit}
      className="border-t border-line bg-sand-100 py-14 sm:py-20 lg:py-28"
    >
      <Reveal className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="reveal eyebrow mb-5">{content.eyebrow}</p>
          <h2 className="reveal h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
            <HighlightedText value={content.heading} />
          </h2>
          <p className="reveal mt-3 text-lg leading-relaxed text-cream-dim lg:mt-6">
            {content.subtitle}
          </p>
        </div>

        {/* A fixed-aspect mosaic that resolves to one clean rectangle. The
            drag comparison is the wide anchor across the top-left; one photo
            sits beside it and three run along the bottom. Every tile fills its
            grid cell (object-cover), so the block is edge-to-edge with no
            ragged step — the reference layout, exactly. On mobile it collapses
            to the slider full-width over a 2×2 of photos. */}
        <div className="reveal mt-5 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-12 lg:aspect-[5/4] lg:grid-cols-3 lg:grid-rows-2">
          <div className="col-span-2 lg:row-start-1">
            <BeforeAfter before={content.sliderBefore} after={content.sliderAfter} />
          </div>

          {content.tiles.map((g, i) => (
            <Tile
              key={`${g.label}-${i}`}
              img={g.image.src}
              label={g.label}
              alt={g.image.alt}
              className={`aspect-[3/4] lg:aspect-auto lg:h-full ${
                i === 0 ? "lg:col-start-3 lg:row-start-1" : "lg:row-start-2"
              }`}
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
