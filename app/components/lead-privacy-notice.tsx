import Link from "next/link";

type LeadPrivacyNoticeProps = {
  className?: string;
};

export default function LeadPrivacyNotice({ className }: LeadPrivacyNoticeProps) {
  return (
    <p className={className} style={{ fontSize: "0.375rem" }}>
      <Link href="/terms">T&amp;C apply</Link>
    </p>
  );
}
