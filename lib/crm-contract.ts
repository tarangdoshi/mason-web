export const quizVersion = "risk-quiz-v1";

export const packageCatalog = [
  {
    code: "package-essential",
    name: "Essential"
  },
  {
    code: "package-comfort",
    name: "Comfort"
  }
] as const;

export type KnownPackageCode = (typeof packageCatalog)[number]["code"];
export type KnownPackageName = (typeof packageCatalog)[number]["name"];

export function getPackageNameFromCode(packageCode?: string | null) {
  return packageCatalog.find((item) => item.code === packageCode)?.name ?? null;
}

export function getPackageCodeFromName(packageName?: string | null) {
  return packageCatalog.find((item) => item.name === packageName)?.code ?? null;
}

export function formatPackageLabel(packageCode?: string | null) {
  const packageName = getPackageNameFromCode(packageCode);
  if (packageName) {
    return packageName;
  }

  if (!packageCode) {
    return null;
  }

  return packageCode.replaceAll("-", " ");
}
