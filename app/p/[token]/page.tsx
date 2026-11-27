import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicApiBaseUrl } from "../../../lib/api";
import { loadProposalContent } from "../../../lib/proposals/content";
import { buildProposalDoc, SHARE_TOKEN_PATTERN } from "../../../lib/proposals/document";
import { proposalsEnabled } from "../../../lib/proposals/flag";
import { fetchPublicView } from "../../../lib/proposals/public";
import CustomerProposal from "./customer-proposal";
import RegisterProposalsWorker from "../../../components/proposals/RegisterProposalsWorker";

/* Customer proposal page. Server-rendered from the API's public view plus PUBLISHED Sanity copy.
   No customer data in the title or URL (the URL carries only the share token); never indexed.
   Unknown, revoked or draft tokens are a plain 404, as is everything while the flag is off. */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your proposal | Mason Company",
  description: "Your Mason Company bathroom safety proposal.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  openGraph: null,
  twitter: null
};

export default async function CustomerProposalPage({ params }: { params: Promise<{ token: string }> }) {
  if (!proposalsEnabled()) notFound();
  const { token } = await params;
  if (!SHARE_TOKEN_PATTERN.test(token)) notFound();
  const view = await fetchPublicView(token);
  if (!view || view.totals.essentialPaise === null) notFound();
  const content = await loadProposalContent({ preview: false });
  if (!content) notFound(); // the template is not published yet
  const doc = buildProposalDoc(view, content);
  return (
    <>
      {/* Keeps this one proposal readable with no signal (the worker holds only the most recent /p/ page). */}
      <RegisterProposalsWorker scope="/p/" />
      <CustomerProposal doc={doc} token={token} apiBase={getPublicApiBaseUrl()} />
    </>
  );
}
