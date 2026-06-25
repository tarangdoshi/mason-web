import GlobalBrandBar from "../components/global-brand-bar";
import LaunchAnalytics from "../components/launch-analytics";
import LegalFooter from "../components/legal-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LaunchAnalytics />
      <GlobalBrandBar />
      {children}
      <LegalFooter />
    </>
  );
}
