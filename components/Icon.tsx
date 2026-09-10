/* Material Symbols, inlined as paths rather than pulled in as an icon font.
   One arrow does not justify a webfont download, and inline SVG takes
   currentColor and scales with the surrounding type. Paths are the official
   Material geometry (24px grid) — add more here as they are needed. */

type IconProps = {
  /** Rendered size in px. Defaults to the CTA arrow size. */
  size?: number;
  className?: string;
};

function Glyph({ size, className, d }: IconProps & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export function ArrowForward({ size = 18, className }: IconProps) {
  return (
    <Glyph
      size={size}
      className={className}
      d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
    />
  );
}

/* These two are exact mirrors about x=12, which the hand-drawn chevrons they
   replaced were not — one sat at 11.5 and the other at 12.5, so centring the
   SVG box left them looking unevenly padded inside their buttons. */
export function ChevronLeft({ size = 20, className }: IconProps) {
  return (
    <Glyph
      size={size}
      className={className}
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
    />
  );
}

export function ChevronRight({ size = 20, className }: IconProps) {
  return (
    <Glyph
      size={size}
      className={className}
      d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
    />
  );
}

export function Call({ size = 18, className }: IconProps) {
  return (
    <Glyph
      size={size}
      className={className}
      d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a.99.99 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"
    />
  );
}
