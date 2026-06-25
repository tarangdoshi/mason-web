"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { storeLeadCtaContext } from "../../lib/lead-context";

type PackageCheckoutLinkProps = LinkProps & {
  className?: string;
  children: ReactNode;
  entryPoint: string;
  pageSection: string;
  ctaId: string;
  packageCode: string;
  packageName: string;
};

export default function PackageCheckoutLink({
  className,
  children,
  entryPoint,
  pageSection,
  ctaId,
  packageCode,
  packageName,
  ...props
}: PackageCheckoutLinkProps) {
  return (
    <Link
      {...props}
      className={className}
      data-analytics-event="package_cta_click"
      data-analytics-package={packageCode}
      data-analytics-cta-location={entryPoint}
      data-analytics-section={pageSection}
      onClick={() =>
        storeLeadCtaContext({
          entryPoint,
          pageSection,
          ctaId,
          packageCode,
          packageName
        })
      }
    >
      {children}
    </Link>
  );
}
