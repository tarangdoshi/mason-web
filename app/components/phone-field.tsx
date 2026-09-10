"use client";

import { forwardRef } from "react";
import { INDIAN_MOBILE_ERROR, formatNationalMobile, sanitizePhoneInput } from "../../lib/phone";
import styles from "./guidance-form.module.css";

interface Props {
  /** Ten national digits, without the +91 prefix. */
  value: string;
  onChange: (nationalDigits: string) => void;
  disabled?: boolean;
  error?: string | null;
  describedById?: string;
}

/**
 * Indian mobile input: the +91 prefix is fixed and non-editable, and the
 * customer types only the ten national digits. Pasted values that include a
 * country code, leading zero or separators are reduced to those digits.
 */
const PhoneField = forwardRef<HTMLInputElement, Props>(function PhoneField(
  { value, onChange, disabled, error, describedById },
  ref
) {
  const errorId = describedById ? `${describedById}-error` : undefined;

  return (
    <label>
      <span>
        Mobile number <span className={styles.requiredMark}>*</span>
      </span>
      <span className={styles.phoneRow} data-invalid={error ? "true" : undefined}>
        <span className={styles.phonePrefix} aria-hidden="true">
          +91
        </span>
        <input
          ref={ref}
          type="tel"
          name="phone"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="99718 91017"
          aria-label="Mobile number, ten digits, India country code plus 91"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && errorId ? errorId : undefined}
          className={styles.phoneInput}
          required
          disabled={disabled}
          value={formatNationalMobile(value)}
          onChange={(event) => onChange(sanitizePhoneInput(event.target.value))}
          onPaste={(event) => {
            // Handle the paste explicitly so a value like "+91 99718 91017"
            // does not momentarily exceed the ten-digit limit.
            const pasted = event.clipboardData.getData("text");
            if (pasted) {
              event.preventDefault();
              onChange(sanitizePhoneInput(pasted));
            }
          }}
        />
      </span>
      {error ? (
        <span id={errorId} className={styles.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
});

export default PhoneField;
export { INDIAN_MOBILE_ERROR };
