/**
 * Indian mobile input helpers for the public forms.
 *
 * The field shows a fixed `+91` prefix and the customer types only the ten
 * national digits. Pasted values may still arrive with a country code, a
 * leading zero, spaces, hyphens or brackets, so every value is reduced to its
 * national digits before it is displayed, validated or submitted.
 *
 * These rules intentionally mirror `apps/api/src/phone.ts`; the API re-validates
 * every submission, so this layer is for usability, not trust.
 */

export const INDIAN_MOBILE_ERROR =
  "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.";

export const NATIONAL_MOBILE_LENGTH = 10;

/** Reduce any typed or pasted value to at most ten national digits. */
export function sanitizePhoneInput(rawValue: string): string {
  let digits = (rawValue || "").replace(/\D/g, "");

  // Only treat a leading 91/0 as a prefix when the value is too long to be a
  // national number on its own — a real number may itself begin with 91.
  if (digits.length > NATIONAL_MOBILE_LENGTH) {
    if (digits.startsWith("091")) {
      digits = digits.slice(3);
    } else if (digits.startsWith("91")) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
  }

  // No Indian mobile number begins with 0.
  digits = digits.replace(/^0+/, "");

  return digits.slice(0, NATIONAL_MOBILE_LENGTH);
}

/** Readable grouping while typing, e.g. `99718 91017`. */
export function formatNationalMobile(nationalDigits: string): string {
  const digits = nationalDigits.slice(0, NATIONAL_MOBILE_LENGTH);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function isValidNationalMobile(nationalDigits: string): boolean {
  return /^[6-9]\d{9}$/.test(nationalDigits);
}

/** Canonical E.164 value sent to the API, or null when incomplete/invalid. */
export function toE164(nationalDigits: string): string | null {
  return isValidNationalMobile(nationalDigits) ? `+91${nationalDigits}` : null;
}

/** Convenience for arbitrary input (e.g. a pasted string) straight to E.164. */
export function normalizeIndianMobileToE164(rawValue: string): string | null {
  return toE164(sanitizePhoneInput(rawValue));
}
