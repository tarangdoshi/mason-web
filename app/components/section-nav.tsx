"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { NavLinkContent } from "../../content/types";
import styles from "./section-nav.module.css";

type SectionNavProps = {
  links: NavLinkContent[];
  motionMode?: "legacy" | "native";
};

function getInitialHash() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.hash;
}

function resolveStickyOffsetPx() {
  const rawOffset = window.getComputedStyle(document.documentElement).getPropertyValue("--sticky-nav-offset").trim();
  if (!rawOffset) {
    return 84;
  }

  const numeric = Number.parseFloat(rawOffset);
  if (!Number.isFinite(numeric)) {
    return 84;
  }

  if (rawOffset.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    return Number.isFinite(rootFontSize) ? numeric * rootFontSize : 84;
  }

  return numeric;
}

export default function SectionNav({ links }: SectionNavProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hrefs = useMemo(() => links.map((link) => link.href).filter((href) => href.startsWith("#")), [links]);
  const spyHrefs = useMemo(() => {
    const filtered = hrefs.filter((href) => href !== "#book-visit");
    return filtered.length > 0 ? filtered : hrefs;
  }, [hrefs]);
  const [activeHref, setActiveHref] = useState<string>(() => getInitialHash() || spyHrefs[0] || hrefs[0] || "");

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement || typeof window === "undefined") {
      return;
    }

    const docStyle = document.documentElement.style;
    const previousOffset = docStyle.getPropertyValue("--sticky-nav-offset");

    const writeOffset = () => {
      const nextHeight = Math.ceil(rootElement.getBoundingClientRect().height);
      if (nextHeight > 0) {
        docStyle.setProperty("--sticky-nav-offset", `${nextHeight}px`);
      }
    };

    writeOffset();

    const resizeObserver = new ResizeObserver(() => {
      writeOffset();
    });

    resizeObserver.observe(rootElement);
    window.addEventListener("resize", writeOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", writeOffset);
      if (previousOffset) {
        docStyle.setProperty("--sticky-nav-offset", previousOffset);
      } else {
        docStyle.removeProperty("--sticky-nav-offset");
      }
    };
  }, []);

  useEffect(() => {
    if (spyHrefs.length === 0) {
      return;
    }

    const sections = spyHrefs
      .map((href) => {
        const element = document.getElementById(href.slice(1));
        return element ? { href, element } : null;
      })
      .filter((entry): entry is { href: string; element: HTMLElement } => Boolean(entry))
      .sort((a, b) => a.element.offsetTop - b.element.offsetTop);

    if (sections.length === 0) {
      return;
    }

    const resolveActiveFromViewport = () => {
      const stickyOffset = resolveStickyOffsetPx();
      const triggerPoint = window.scrollY + stickyOffset + 12;
      let nextActive = sections[0]?.href ?? spyHrefs[0];

      for (const section of sections) {
        if (section.element.offsetTop <= triggerPoint) {
          nextActive = section.href;
        } else {
          break;
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        nextActive = sections[sections.length - 1]?.href ?? nextActive;
      }

      return nextActive;
    };

    const onScrollOrResize = () => {
      window.requestAnimationFrame(() => {
        setActiveHref(resolveActiveFromViewport());
      });
    };

    const onHashChange = () => {
      const nextHash = window.location.hash;
      if (nextHash && hrefs.includes(nextHash)) {
        setActiveHref(nextHash);
      }
    };

    setActiveHref(window.location.hash && hrefs.includes(window.location.hash) ? window.location.hash : resolveActiveFromViewport());
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hrefs, spyHrefs]);

  const handleAnchorClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) {
        return;
      }

      const target = document.getElementById(href.slice(1));
      if (!target) {
        return;
      }

      event.preventDefault();
      setActiveHref(href);
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
      if (window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
    },
    []
  );

  return (
    <div ref={rootRef} className={styles.surface}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <ul className={styles.links}>
          {links.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <li key={item.href} className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""}`}>
                <a href={item.href} aria-current={isActive ? "page" : undefined} onClick={(event) => handleAnchorClick(event, item.href)} className={styles.link}>
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
