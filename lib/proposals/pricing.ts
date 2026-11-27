/**
 * Local copy of the mason-api pricing engine (`src/proposals/pricing.ts`), so the staff screen can price with
 * no signal. Pure: no I/O, no clock, integer paise throughout. The server stays the authority: every offline
 * price is re-priced by the API when the queued save syncs.
 *
 * Kept in step with the API by a shared fixture: `lib/proposals/fixtures/pricing-cases.json` holds inputs and
 * the API engine's own outputs; `lib/proposals-phase3.test.ts` checks this file reproduces every one. A change
 * to the API engine needs a fresh fixture (see docs/proposals-web.md, "Offline pricing").
 *
 *   line          = unit price × qty, for recommended items only
 *   essentialRaw  = Σ essential lines + Σ complimentary lines (any tier) + manpower & shipping
 *   addonRaw      = essentialRaw + Σ non-complimentary add-on lines
 *   totals        = each rounded UP to the next k·step − ₹1 (step ₹1,000 gives …999). No GST.
 */
import { proposalComponentName } from "./components";

export type PriceEntry = { component: string; variant: string | null; unitPaise: number };
export type PriceList = { version: string; entries: PriceEntry[] };
export type ManpowerRule = { kind: "fixed"; amountPaise: number };
export type PricingConfig = { manpower: ManpowerRule; roundUpStepPaise: number };

export type PricingItem = {
  component: string;
  state: "recommended" | "present" | "declined";
  qty: number;
  variant?: string | null;
  tier: "essential" | "addon";
  complimentary?: boolean;
};

export type PricedLine = {
  component: string; name: string; variant: string | null; qty: number; tier: "essential" | "addon";
  unitPaise: number; complimentary: boolean; linePaise: number;
};

export type PricingResult = {
  essentialRawPaise: number;
  addonRawPaise: number | null;
  essentialTotalPaise: number;
  addonTotalPaise: number | null;
  snapshot: { version: string; manpower: ManpowerRule; manpowerPaise: number; roundUpStepPaise: number; lines: PricedLine[] };
};

export type PricingErrorCode = "UNKNOWN_PRICE" | "VARIANT_REQUIRED" | "INVALID_ITEM" | "INVALID_CONFIG";

export class PricingError extends Error {
  constructor(readonly code: PricingErrorCode, message: string) {
    super(message);
    this.name = "PricingError";
  }
}

export const FIXED_ESSENTIAL_PAISE = 525_000;
export const DEFAULT_ROUND_UP_STEP_PAISE = 100_000;
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  manpower: { kind: "fixed", amountPaise: FIXED_ESSENTIAL_PAISE },
  roundUpStepPaise: DEFAULT_ROUND_UP_STEP_PAISE
};
const ONE_RUPEE = 100;

/** Same as the API's `normaliseLabel`: case-, space- and punctuation-insensitive. */
export function normaliseLabel(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function roundUpToNines(amountPaise: number, stepPaise: number): number {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0) throw new PricingError("INVALID_CONFIG", "Amount must be non-negative paise.");
  if (stepPaise === 0) return amountPaise;
  if (!Number.isSafeInteger(stepPaise) || stepPaise <= ONE_RUPEE) throw new PricingError("INVALID_CONFIG", "Rounding step must exceed ₹1.");
  return Math.ceil((amountPaise + ONE_RUPEE) / stepPaise) * stepPaise - ONE_RUPEE;
}

export function findPriceEntry(list: PriceList, component: string, variant?: string | null): PriceEntry {
  const rows = list.entries.filter((entry) => entry.component === component);
  if (!rows.length) throw new PricingError("UNKNOWN_PRICE", `No price for ${component}.`);
  if (variant?.trim()) {
    const wanted = normaliseLabel(variant);
    const match = rows.find((entry) => normaliseLabel(entry.variant ?? "") === wanted);
    if (!match) throw new PricingError("UNKNOWN_PRICE", `No price for ${component} variant "${variant}".`);
    return match;
  }
  if (rows.length === 1) return rows[0];
  const plain = rows.find((entry) => entry.variant === null);
  if (plain) return plain;
  throw new PricingError("VARIANT_REQUIRED", `Choose a variant for ${component}.`);
}

export function manpowerPaise(rule: ManpowerRule): number {
  if (rule?.kind !== "fixed" || !Number.isSafeInteger(rule.amountPaise) || rule.amountPaise < 0) {
    throw new PricingError("INVALID_CONFIG", "Manpower rule must be a fixed, non-negative paise amount.");
  }
  return rule.amountPaise;
}

export function priceProposal(items: PricingItem[], list: PriceList, config: PricingConfig = DEFAULT_PRICING_CONFIG): PricingResult {
  const manpower = manpowerPaise(config.manpower);
  const lines: PricedLine[] = [];
  for (const item of items) {
    if (!Number.isSafeInteger(item.qty) || item.qty < 1) throw new PricingError("INVALID_ITEM", `Quantity for ${item.component} must be a positive whole number.`);
    if (item.state !== "recommended") continue;
    const entry = findPriceEntry(list, item.component, item.variant);
    lines.push({
      component: item.component, name: proposalComponentName(item.component) ?? item.component, variant: entry.variant, qty: item.qty, tier: item.tier,
      unitPaise: entry.unitPaise, complimentary: item.complimentary === true, linePaise: entry.unitPaise * item.qty
    });
  }

  const sum = (selected: PricedLine[]) => selected.reduce((total, line) => total + line.linePaise, 0);
  const essentialRawPaise = sum(lines.filter((line) => line.tier === "essential" || line.complimentary)) + manpower;
  const addonLines = lines.filter((line) => line.tier === "addon" && !line.complimentary);
  const addonRawPaise = addonLines.length ? essentialRawPaise + sum(addonLines) : null;

  return {
    essentialRawPaise,
    addonRawPaise,
    essentialTotalPaise: roundUpToNines(essentialRawPaise, config.roundUpStepPaise),
    addonTotalPaise: addonRawPaise === null ? null : roundUpToNines(addonRawPaise, config.roundUpStepPaise),
    snapshot: { version: list.version, manpower: config.manpower, manpowerPaise: manpower, roundUpStepPaise: config.roundUpStepPaise, lines }
  };
}

/** Shape check for a price list read back from the cache (it may be from an older build). */
export function isPriceList(value: unknown): value is PriceList {
  const list = value as PriceList | null;
  return Boolean(list && typeof list.version === "string" && Array.isArray(list.entries)
    && list.entries.every((entry) => typeof entry?.component === "string" && (entry.variant === null || typeof entry.variant === "string") && Number.isSafeInteger(entry.unitPaise) && entry.unitPaise >= 0));
}

export function isPricingConfig(value: unknown): value is PricingConfig {
  const config = value as PricingConfig | null;
  return Boolean(config && config.manpower?.kind === "fixed" && Number.isSafeInteger(config.manpower.amountPaise) && Number.isSafeInteger(config.roundUpStepPaise));
}
