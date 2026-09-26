import Link from "next/link";

type LeadPrivacyNoticeProps = {
  className?: string;
};

/* Subordinate legal line under every customer form's submit button, at 10px.
   Only the two policy names are links; the sentence itself is plain text. */
export default function LeadPrivacyNotice({ className }: LeadPrivacyNoticeProps) {
  return (
    <p className={className} style={{ fontSize: "0.625rem", lineHeight: 1.4 }}>
      By submitting, you agree to our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
    </p>
  );
}
