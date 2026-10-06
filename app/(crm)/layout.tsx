import type { Metadata } from "next";
import CrmProvider from "./crm-provider";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CrmRouteLayout({ children }: { children: React.ReactNode }) {
  return <CrmProvider>{children}</CrmProvider>;
}
