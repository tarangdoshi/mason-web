/* Proposal copy markers, shared by the Sanity schema, the seed and the customer document. Kept free of any
   Sanity import so the customer page never bundles the Studio. */

/** A component benefit line the CMO still has to write. Allowed in a draft; Studio blocks publishing it. */
export const CMO_PLACEHOLDER_PREFIX = "CMO TO WRITE:";

export const TEMPLATE_PLACEHOLDERS = ["customerName", "date", "essentialPrice", "addonPrice", "addonName"] as const;

export function unknownPlaceholders(value: string): string[] {
  return [...value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]).filter((name) => !(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(name));
}
