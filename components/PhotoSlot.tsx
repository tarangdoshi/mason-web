import Image from "next/image";

/* A picture, or an obvious hole where one goes.

   Every image slot on a page routes through this, so the ones still waiting on
   real photography announce themselves — subject written on the panel — rather
   than quietly shipping a stand-in that looks close enough to miss. Fill `src`
   to turn a slot real; nothing else about the layout changes. */

export default function PhotoSlot({
  src,
  label,
  alt = "",
  initials,
  sizes = "100vw",
  className = "",
  position = "",
  priority = false,
}: {
  /** Omit while the photo is still to be shot. */
  src?: string;
  /** What belongs here. Shown on the placeholder, so write it for a human. */
  label: string;
  /** Empty where the caption beside it already says the same thing. */
  alt?: string;
  /** Portrait slots only: too small for the panel, so they stand in with an
      initials disc instead — the same one Doctors.tsx uses. */
  initials?: string;
  sizes?: string;
  className?: string;
  /** object-position utility, for the slots where centring cuts the subject —
      a tall portrait dropped into a wide box being the usual one. */
  position?: string;
  priority?: boolean;
}) {
  if (!src && initials) {
    return (
      <div
        title={label}
        className={`grid shrink-0 place-items-center rounded-full bg-forest-700 font-display font-bold text-sand-100 ${className}`}
      >
        <span aria-hidden="true">{initials}</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`relative grid place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2 ${className}`}
      >
        <div className="px-6 py-8 text-center">
          <p className="eyebrow">Photo to come</p>
          <p className="mt-2 text-sm leading-snug text-sand-600">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${position}`}
      />
    </div>
  );
}
