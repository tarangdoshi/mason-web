import Link from "next/link";

type LeadPrivacyNoticeProps = {
  className?: string;
};

export default function LeadPrivacyNotice({ className }: LeadPrivacyNoticeProps) {
  return (
    <p className={className}>
      <Link href="/terms">T&amp;C apply</Link>
    </p>
  );
}
