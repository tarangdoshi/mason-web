/**
 * Email normalization and validation for the public assessment form.
 *
 * Deliberately stricter than the browser's native `type="email"` check, which
 * accepts a dotless domain such as `abc@gmail`. The API applies the same rules
 * independently, so this layer is for fast feedback, not trust.
 */

export const EMAIL_ERROR = "Enter a valid email address, for example name@example.com.";

export const MAX_EMAIL_LENGTH = 254;

// local@domain where:
//  - the local part is dot-separated atoms (no leading, trailing or doubled dot)
//  - the domain is dot-separated labels ending in an alphabetic TLD of 2+ chars
//  - no spaces and no second "@" can appear anywhere
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

/** Trim surrounding whitespace and lowercase — the canonical stored form. */
export function normalizeEmail(rawValue: string): string {
  return (rawValue || "").trim().toLowerCase();
}

export function isValidEmail(normalizedEmail: string): boolean {
  if (!normalizedEmail || normalizedEmail.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  return EMAIL_PATTERN.test(normalizedEmail);
}

/** Canonical value for submission, or null when the input is unusable. */
export function toCanonicalEmail(rawValue: string): string | null {
  const normalized = normalizeEmail(rawValue);
  return isValidEmail(normalized) ? normalized : null;
}
