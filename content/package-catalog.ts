import { comparePackagesContent } from "./compare-packages.content";
import { homepageContent } from "./homepage.content";
import type { PackageFeatureItem, PackagePlanContent } from "./types";

type PackageSection = {
  title: string;
  subtitle: string;
  features: PackageFeatureItem[];
  addOnFeatures?: PackageFeatureItem[];
  plans: PackagePlanContent[];
};

export type PackageCatalogEntry = {
  sectionTitle: string;
  sectionSubtitle: string;
  plan: PackagePlanContent;
  features: PackageFeatureItem[];
  addOnFeatures: PackageFeatureItem[];
};

const sections: PackageSection[] = [homepageContent.packagesSection, comparePackagesContent.packagesSection];

export const packageCatalog: PackageCatalogEntry[] = sections
  .flatMap((section) =>
    section.plans.map((plan) => ({
      sectionTitle: section.title,
      sectionSubtitle: section.subtitle,
      plan,
      features: section.features,
      addOnFeatures: section.addOnFeatures ?? []
    }))
  )
  .reduce<PackageCatalogEntry[]>((catalog, entry) => {
    if (catalog.some((item) => item.plan.id === entry.plan.id)) {
      return catalog;
    }
    catalog.push(entry);
    return catalog;
  }, []);

export function getPackageCatalogEntry(packageId?: string | null) {
  if (!packageId) {
    return null;
  }
  return packageCatalog.find((entry) => entry.plan.id === packageId) ?? null;
}

export function getIncludedFeatures(entry: PackageCatalogEntry) {
  return entry.features.filter((feature) => entry.plan.includedFeatureIds.includes(feature.id));
}

export function getExcludedFeatures(entry: PackageCatalogEntry) {
  return entry.features.filter((feature) => !entry.plan.includedFeatureIds.includes(feature.id));
}

export function getAvailableAddOns(entry: PackageCatalogEntry) {
  if (!entry.plan.availableAddOnIds || entry.plan.availableAddOnIds.length === 0) {
    return [];
  }
  return entry.addOnFeatures.filter((feature) => entry.plan.availableAddOnIds?.includes(feature.id));
}
