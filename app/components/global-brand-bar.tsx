"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalBrandBar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="globalBrandBarWrap">
      <div className="globalBrandBar">
        <Link href="/" className="globalBrandLink" aria-label="Go to Mason Company homepage">
          <span className="globalBrandWordmark">Mason Company</span>
          <span className="globalBrandTagline">Dignified bathroom safety</span>
        </Link>
      </div>
    </div>
  );
}
