"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProposalDocument, { ProposalFontSample } from "../../../../../components/proposals/ProposalDocument";
import { pdfFilename, type ProposalDoc } from "../../../../../lib/proposals/document";
import { inlinePhotos, prepareFonts, renderProposalPdf, warmPdf } from "../../../../../lib/proposals/pdf";
import { loadProposalDocument, shareProposal } from "../actions";
import FamilyView from "./family-view";
import styles from "./family.module.css";

/* Staff actions on a priced proposal: Show family (full screen), Download PDF, Share with the customer.
   The PDF is drawn in the browser from the same component as the customer page. */

type ShareState =
  | { stage: "idle" }
  | { stage: "confirm" }
  | { stage: "working"; label: string }
  | { stage: "ready"; url: string; file: File; canShareFiles: boolean };

const SHARE_TEXT = "Here is your Mason Company proposal. The PDF is attached, and the link opens it online.";

function download(file: File) {
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

export default function CustomerActions({
  proposalId,
  ready,
  version,
  shared,
  onSharing,
  onShared
}: {
  proposalId: string | null;
  ready: boolean;
  version: string;
  shared: boolean;
  /** true while a share is in progress (the screen locks so nothing changes mid-share), false if it failed. */
  onSharing: (active: boolean) => void;
  onShared: () => void;
}) {
  const [doc, setDoc] = useState<ProposalDoc | null>(null);
  const [docVersion, setDocVersion] = useState<string | null>(null);
  const [family, setFamily] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<ShareState>({ stage: "idle" });
  const [copied, setCopied] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<ProposalDoc | null>(null);
  const pdfRoot = useRef<HTMLDivElement | null>(null);
  const pdfWaiter = useRef<{ resolve: (file: File) => void; reject: (error: unknown) => void } | null>(null);
  const fonts = useRef<Promise<string> | null>(null);
  const fontSample = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load the PDF libraries early; fonts are captured with the first document load (which needs the network
  // anyway), so a PDF can then be made offline.
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    void warmPdf().catch(() => undefined);
  }, [mounted]);

  const cached = doc && docVersion === version ? doc : null;
  const closeFamily = useCallback(() => setFamily(false), []);

  const fetchDoc = useCallback(async (): Promise<ProposalDoc | null> => {
    if (cached) return cached;
    if (!proposalId) return null;
    // Exactly the fonts the document uses, from the hidden sample (html-to-image embeds only fonts in the node).
    if (!fonts.current && fontSample.current) fonts.current = prepareFonts(fontSample.current).catch(() => "");
    const result = await loadProposalDocument(proposalId);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    // Photos become data URLs now, while online, so a later PDF (or Show family) needs no network.
    const loaded = await inlinePhotos(result.doc);
    setDoc(loaded);
    setDocVersion(version);
    return loaded;
  }, [cached, proposalId, version]);

  // Draw the offscreen A4 copy, then turn its pages into a PDF.
  useEffect(() => {
    if (!pdfDoc || !pdfRoot.current) return;
    const waiter = pdfWaiter.current;
    const root = pdfRoot.current;
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-testid^="pdf-page-"]'));
      const css = fonts.current ? await fonts.current : undefined;
      const blob = await renderProposalPdf(pages, css || (await prepareFonts(root).catch(() => undefined)));
      if (!cancelled) waiter?.resolve(new File([blob], pdfFilename(pdfDoc.date), { type: "application/pdf" }));
    })().catch((reason) => waiter?.reject(reason)).finally(() => {
      if (!cancelled) setPdfDoc(null);
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  const makePdf = (source: ProposalDoc) =>
    new Promise<File>((resolve, reject) => {
      pdfWaiter.current = { resolve, reject };
      setPdfDoc(source);
    });

  const showFamily = async () => {
    setError(null);
    // Ask for full screen inside the tap itself (browsers require a user gesture), then load.
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    setBusy("Opening…");
    const loaded = await fetchDoc();
    setBusy(null);
    if (loaded) setFamily(true);
    else if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  };

  const downloadPdf = async () => {
    setError(null);
    setBusy("Making the PDF…");
    try {
      const loaded = await fetchDoc();
      if (loaded) download(await makePdf(loaded));
    } catch {
      setError("The PDF could not be made. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const confirmShare = async () => {
    if (!proposalId) return;
    setError(null);
    onSharing(true); // lock the screen first: an edit made during the share would not be in what is shared
    setShare({ stage: "working", label: "Sharing…" });
    const result = await shareProposal(proposalId);
    if (!result.ok || !result.shareUrl) {
      onSharing(false);
      setShare({ stage: "idle" });
      setError(result.ok ? "The proposal was not shared. Try again." : result.error);
      return;
    }
    onShared();
    if (!fonts.current && fontSample.current) fonts.current = prepareFonts(fontSample.current).catch(() => "");
    const sharedDoc = await inlinePhotos(result.doc);
    setDoc(sharedDoc);
    setDocVersion(version);
    setShare({ stage: "working", label: "Making the PDF…" });
    try {
      const file = await makePdf(sharedDoc);
      const url = result.shareUrl;
      const canShareFiles = typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [file] }));
      setShare({ stage: "ready", url, file, canShareFiles });
    } catch {
      setShare({ stage: "idle" });
      setError("Shared, but the PDF could not be made. Tap Share again to retry.");
    }
  };

  // A separate tap for the share sheet: browsers only open it straight from a user gesture.
  const sendNative = async (state: Extract<ShareState, { stage: "ready" }>) => {
    try {
      await navigator.share({ files: [state.file], url: state.url, text: SHARE_TEXT, title: "Mason Company proposal" });
    } catch (reason) {
      if ((reason as DOMException)?.name !== "AbortError") setShare({ ...state, canShareFiles: false });
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Copy the link from the box below.");
    }
  };

  const disabled = !ready || busy !== null || share.stage === "working";

  return (
    <div className={styles.sharePanel} data-testid="customer-actions">
      <div className={styles.shareRow}>
        <button type="button" className={styles.shareButton} onClick={showFamily} disabled={disabled} data-testid="show-family">
          Show family
        </button>
        <button type="button" className={styles.shareButton} onClick={downloadPdf} disabled={disabled} data-testid="download-pdf">
          Download PDF
        </button>
        {share.stage !== "ready" ? (
          <button
            type="button"
            className={styles.shareButton}
            data-primary=""
            onClick={() => (shared ? confirmShare() : setShare({ stage: "confirm" }))}
            disabled={disabled || share.stage === "confirm"}
            data-testid="share-start"
          >
            Share with customer
          </button>
        ) : null}
      </div>
      {busy ? <p className={styles.shareNote} role="status">{busy}</p> : null}
      {share.stage === "confirm" ? (
        <div className={styles.shareRow} data-testid="share-confirm">
          <p className={styles.shareNote}>Sharing locks this proposal: later changes need a new proposal.</p>
          <button type="button" className={styles.shareButton} data-primary="" onClick={confirmShare} data-testid="share-confirm-yes">
            Share now
          </button>
          <button type="button" className={styles.shareButton} onClick={() => setShare({ stage: "idle" })}>
            Cancel
          </button>
        </div>
      ) : null}
      {share.stage === "working" ? <p className={styles.shareNote} role="status">{share.label}</p> : null}
      {share.stage === "ready" ? (
        <div className={styles.sharePanel} data-testid="share-ready">
          <div className={styles.shareRow}>
            {share.canShareFiles ? (
              <button type="button" className={styles.shareButton} data-primary="" onClick={() => sendNative(share)} data-testid="share-send">
                Send to customer
              </button>
            ) : null}
            <button type="button" className={styles.shareButton} onClick={() => download(share.file)} data-testid="share-download">
              Download PDF
            </button>
            <button type="button" className={styles.shareButton} onClick={() => copyLink(share.url)} data-testid="share-copy">
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
          <input className={styles.linkField} readOnly value={share.url} aria-label="Customer link" data-testid="share-link" onFocus={(event) => event.currentTarget.select()} />
        </div>
      ) : null}
      {error ? <p className={styles.shareError} role="alert" data-testid="share-error">{error}</p> : null}
      {family && cached ? <FamilyView doc={cached} onClose={closeFamily} /> : null}
      {/* Offscreen copies live under <body>, away from the CRM panel's own heading/paragraph styles. */}
      {mounted
        ? createPortal(
            <>
              <div className={styles.pdfSource} ref={fontSample} aria-hidden="true">
                <ProposalFontSample />
              </div>
              {pdfDoc ? (
                <div className={styles.pdfSource} ref={pdfRoot} aria-hidden="true">
                  <ProposalDocument doc={pdfDoc} mode="a4" idPrefix="pdf" />
                </div>
              ) : null}
            </>,
            document.body
          )
        : null}
    </div>
  );
}
