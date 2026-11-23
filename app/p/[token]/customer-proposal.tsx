"use client";

import { useEffect, useRef, useState } from "react";
import ProposalDocument, { type ProposalOption } from "../../../components/proposals/ProposalDocument";
import type { ProposalDoc } from "../../../lib/proposals/document";
import { doNotTrack, eventsUrl, sendViewerEvent, startHeartbeat } from "../../../lib/proposals/viewer-events";
import styles from "./customer-page.module.css";

/** Customer proposal with viewer events: opened (once per load), viewed heartbeats (not under Do Not Track),
    option_chosen on tapping an option card. */
export default function CustomerProposal({ doc, token, apiBase }: { doc: ProposalDoc; token: string; apiBase: string }) {
  const [chosen, setChosen] = useState<ProposalOption | null>(null);
  const url = eventsUrl(apiBase, token);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      sendViewerEvent(url, { type: "opened" });
    }
    if (doNotTrack({ navigator, window: window as unknown as { doNotTrack?: string } })) return;
    const heartbeat = startHeartbeat({
      send: (durationMs) => sendViewerEvent(url, { type: "viewed", durationMs }),
      isVisible: () => document.visibilityState === "visible",
      now: () => performance.now(),
      setInterval: (fn, ms) => window.setInterval(fn, ms),
      clearInterval: (handle) => window.clearInterval(handle as number)
    });
    const onVisibility = () => heartbeat.visibilityChanged();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      heartbeat.stop();
    };
  }, [url]);

  const choose = (option: ProposalOption) => {
    setChosen(option);
    sendViewerEvent(url, { type: "option_chosen", option });
  };

  return (
    <main className={styles.main}>
      <ProposalDocument doc={doc} chosen={chosen} onChoose={choose} />
    </main>
  );
}
