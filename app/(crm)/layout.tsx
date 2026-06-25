import CrmProvider from "./crm-provider";

export default function CrmRouteLayout({ children }: { children: React.ReactNode }) {
  return <CrmProvider>{children}</CrmProvider>;
}
