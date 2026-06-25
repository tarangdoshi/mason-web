"use client";

import { useEffect, useState } from "react";
import styles from "./explainer-tile.module.css";

type ExplainerTileProps = {
  title: string;
  caption: string;
  poster: string;
  posterAlt: string;
  embedUrl: string;
  externalUrl: string;
  durationLabel: string;
};

export default function ExplainerTile({
  title,
  caption,
  poster,
  posterAlt,
  embedUrl,
  durationLabel
}: ExplainerTileProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <article className={styles.tile}>
        <button type="button" className={styles.trigger} onClick={() => setIsOpen(true)} aria-label={`Play video: ${title}`}>
          <div className={styles.posterWrap}>
            <img src={poster} alt={posterAlt} className={styles.poster} loading="lazy" decoding="async" />
            <span className={styles.duration}>{durationLabel}</span>
            <span className={styles.playBadge}>
              <span className={styles.playIcon}>▶</span>
              Watch explainer
            </span>
          </div>
          <div className={styles.body}>
            <p className={styles.eyebrow}>Video reference</p>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.caption}>{caption}</p>
          </div>
        </button>
      </article>

      {isOpen ? (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onClick={() => setIsOpen(false)}>
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <p className={styles.dialogTitle}>{title}</p>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close video">
                ×
              </button>
            </div>
            <div className={styles.dialogBody}>
              <div className={styles.frameWrap}>
                <iframe
                  className={styles.frame}
                  src={`${embedUrl}?autoplay=1&rel=0`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
