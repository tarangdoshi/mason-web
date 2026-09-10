export type SanityDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
};

export type MigrationOperation = {
  documentId: string;
  path: string;
  currentValue: unknown;
  proposedValue: unknown;
  changed: boolean;
  kind: "leaf" | "array-replacement";
  reason?: string;
};

export function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function valueAtPath(document: SanityDocument, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, document);
}

export function createLeafOperation(
  documentId: string,
  document: SanityDocument,
  path: string,
  proposedValue: unknown,
): MigrationOperation {
  const currentValue = valueAtPath(document, path);
  return {
    documentId,
    path,
    currentValue,
    proposedValue,
    changed: !valuesEqual(currentValue, proposedValue),
    kind: "leaf",
  };
}

function assertUniqueKeys(items: unknown[], label: string): Map<string, Record<string, unknown>> {
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of items) {
    if (!item || typeof item !== "object" || typeof (item as Record<string, unknown>)._key !== "string") {
      throw new Error(`Safety check failed: ${label} contains an item without a stable _key.`);
    }
    const key = (item as Record<string, unknown>)._key as string;
    if (byKey.has(key)) throw new Error(`Safety check failed: ${label} contains duplicate _key ${key}.`);
    byKey.set(key, item as Record<string, unknown>);
  }
  return byKey;
}

export function mergeArrayPreservingUnknownFields(
  currentValue: unknown,
  proposedValue: unknown[],
  label: string,
): unknown[] {
  if (!Array.isArray(currentValue)) throw new Error(`Safety check failed: ${label} is not an array.`);
  if (proposedValue.every((item) => typeof item !== "object" || item === null)) return proposedValue;

  const currentByKey = assertUniqueKeys(currentValue, label);
  const proposedByKey = assertUniqueKeys(proposedValue, `${label} proposed content`);
  return proposedValue.map((item) => {
    const key = (item as Record<string, unknown>)._key as string;
    const current = currentByKey.get(key);
    return current ? { ...current, ...(item as Record<string, unknown>) } : item;
  });
}

export function createArrayReplacementOperation(
  documentId: string,
  document: SanityDocument,
  path: string,
  proposedValue: unknown[],
  reason: string,
): MigrationOperation {
  const currentValue = valueAtPath(document, path);
  const mergedValue = mergeArrayPreservingUnknownFields(currentValue, proposedValue, `${documentId}.${path}`);
  return {
    documentId,
    path,
    currentValue,
    proposedValue: mergedValue,
    changed: !valuesEqual(currentValue, mergedValue),
    kind: "array-replacement",
    reason,
  };
}

export function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

export type MigrationScope = "homepage" | "packages" | "testimonials" | "all";

export function parseMigrationArgs(argv: string[]): { apply: boolean; dryRun: boolean; backupDir?: string; scope: MigrationScope } {
  const apply = argv.includes("--apply");
  const dryRun = argv.includes("--dry-run") || !apply;
  const backupIndex = argv.indexOf("--backup-dir");
  const backupDir = backupIndex >= 0 ? argv[backupIndex + 1] : undefined;
  const scopeFlag = argv.find((argument) => argument === "--scope" || argument.startsWith("--scope="));
  const scopeIndex = argv.indexOf("--scope");
  const rawScope = scopeFlag?.startsWith("--scope=")
    ? scopeFlag.slice("--scope=".length)
    : scopeIndex >= 0
      ? argv[scopeIndex + 1]
      : undefined;
  const scope = rawScope || "all";
  if (scope !== "homepage" && scope !== "packages" && scope !== "testimonials" && scope !== "all") {
    throw new Error("--scope must be one of homepage, packages, testimonials, or all.");
  }
  if (scopeIndex >= 0 && (!rawScope || rawScope.startsWith("--"))) {
    throw new Error("--scope requires homepage, packages, testimonials, or all.");
  }
  if (backupIndex >= 0 && (!backupDir || backupDir.startsWith("--"))) {
    throw new Error("--backup-dir requires a directory path.");
  }
  if (apply && argv.includes("--dry-run")) throw new Error("Choose either --dry-run or --apply, not both.");
  if (argv.includes("--execute")) throw new Error("--execute is removed. Use --apply with --backup-dir after review.");
  if (!apply && backupDir) throw new Error("--backup-dir is only valid with --apply.");
  return { apply, dryRun, backupDir, scope: scope as MigrationScope };
}

export function assertApplyBackupDir(backupDir: string | undefined): string {
  if (!backupDir) throw new Error("Refusing --apply without --backup-dir; a verified timestamped backup is mandatory.");
  return backupDir;
}
