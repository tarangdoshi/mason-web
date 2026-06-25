import Link from "next/link";

type LeadPrivacyNoticeProps = {
  className?: string;
};

export default function LeadPrivacyNotice({ className }: LeadPrivacyNoticeProps) {
  return (
    <p className={className}>
      By submitting, you acknowledge that Mason Company will use your contact details, location information, attribution and session context, quiz context, and booking metadata to respond to your request, check serviceability, prepare your booking, and manage follow-up. This information may be processed in our CRM systems, including Zoho CRM in India. See our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
    </p>
  );
}
