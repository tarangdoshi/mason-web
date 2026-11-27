"use client";

import { useState } from "react";
import { formatRupees } from "../../../../../lib/proposals/builder";
import { LOST_NOTE_MAX, LOST_REASONS, lostProblem, lostReasonLabel, type LostReason } from "../../../../../lib/proposals/lost";
import type { AcceptOption } from "../../../../../lib/proposals/offline/queue";
import styles from "./proposals.module.css";

/* Staff decisions on the proposal: what is waiting for signal, "Customer accepts", and "Lost". */

export function SyncBadge({ count, online, syncing, failed, stale, onRetry, onDiscard }: {
  count: number; online: boolean; syncing: boolean; failed: string | null; stale: boolean; onRetry: () => void; onDiscard: () => void;
}) {
  if (count === 0) return null;
  const items = `${count} ${count === 1 ? "item" : "items"}`;
  if (stale && !failed) {
    return (
      <div className={styles.syncBadge} data-state="failed" data-testid="sync-badge" role="alert">
        <strong>Not synced: {items}</strong>
        <span>This page is out of date. Reload it to sync; nothing waiting is lost.</span>
        <div className={styles.decisionRow}>
          <button type="button" className={styles.secondary} onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
  if (failed) {
    return (
      <div className={styles.syncBadge} data-state="failed" data-testid="sync-badge" role="alert">
        <strong>Not synced: {items}</strong>
        <span>{failed}</span>
        <div className={styles.decisionRow}>
          <button type="button" className={styles.secondary} onClick={onRetry} disabled={!online}>Try again</button>
          <button type="button" className={styles.secondary} onClick={onDiscard}>Discard this change</button>
        </div>
      </div>
    );
  }
  return (
    <p className={styles.syncBadge} data-state={online ? "syncing" : "waiting"} data-testid="sync-badge" role="status">
      {online && syncing ? `Syncing: ${items}` : online ? `Waiting to sync: ${items}` : `Waiting for signal: ${items}`}
    </p>
  );
}

export function AcceptPanel({ accepted, hasAddon, essentialPaise, addonPaise, shared, blockedReason, busy, onAccept }: {
  accepted: { option: AcceptOption; commercialCaseId: string | null } | null;
  hasAddon: boolean;
  essentialPaise: number | null;
  addonPaise: number | null;
  shared: boolean;
  blockedReason: string | null;
  busy: boolean;
  onAccept: (option: AcceptOption) => Promise<string | null>;
}) {
  const [choice, setChoice] = useState<AcceptOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const label = (option: AcceptOption) => (option === "essential" ? "Essential" : "Essential + Add-on");
  const amount = (option: AcceptOption) => formatRupees(option === "essential" ? essentialPaise : addonPaise);

  if (accepted) {
    return (
      <div className={styles.decision} data-testid="accept-done">
        <h4>Customer accepted</h4>
        <p>{label(accepted.option)} at {amount(accepted.option)}.</p>
      </div>
    );
  }
  return (
    <div className={styles.decision} data-testid="accept-panel">
      <h4>Customer accepts</h4>
      {blockedReason ? <p className={styles.error} data-testid="accept-blocked">{blockedReason}</p> : null}
      {choice === null ? (
        <div className={styles.decisionRow}>
          <button type="button" className={styles.secondary} disabled={busy || Boolean(blockedReason)} onClick={() => setChoice("essential")} data-testid="accept-essential">
            Essential
          </button>
          {hasAddon ? (
            <button type="button" className={styles.secondary} disabled={busy || Boolean(blockedReason)} onClick={() => setChoice("essential_addon")} data-testid="accept-addon">
              Essential + Add-on
            </button>
          ) : null}
        </div>
      ) : (
        <div data-testid="accept-confirm">
          <p>
            The customer accepts <strong>{label(choice)}</strong> at <strong>{amount(choice)}</strong>.
            {shared ? "" : " This also shares the proposal, which locks it."} Staff then create the Razorpay links in the payments case.
          </p>
          <div className={styles.decisionRow}>
            <button
              type="button"
              className={styles.primary}
              disabled={working || busy}
              data-testid="accept-confirm-yes"
              onClick={async () => {
                setWorking(true);
                setError(null);
                const problem = await onAccept(choice);
                setWorking(false);
                if (problem) setError(problem);
              }}
            >
              {working ? "Recording…" : "Confirm acceptance"}
            </button>
            <button type="button" className={styles.secondary} disabled={working} onClick={() => setChoice(null)}>Cancel</button>
          </div>
        </div>
      )}
      {error ? <p className={styles.error} role="alert" data-testid="accept-error">{error}</p> : null}
    </div>
  );
}

export function LostPanel({ lost, busy, onLost }: {
  lost: { reason: LostReason; note: string } | null;
  busy: boolean;
  onLost: (reason: LostReason, note: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<LostReason | "">("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  if (lost) {
    return (
      <div className={styles.decision} data-testid="lost-done">
        <h4>Lost</h4>
        <p>Reason: {lostReasonLabel(lost.reason)}{lost.note ? `. ${lost.note}` : ""}</p>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" className={styles.secondary} disabled={busy} onClick={() => setOpen(true)} data-testid="lost-start">
        Mark as lost
      </button>
    );
  }
  const problem = reason ? lostProblem(reason, note) : "Choose a reason.";
  return (
    <form
      className={styles.decision}
      data-testid="lost-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        if (problem || !reason) return;
        if (!confirming) {
          setConfirming(true);
          return;
        }
        setWorking(true);
        setError(null);
        const failure = await onLost(reason, note.trim());
        setWorking(false);
        if (failure) {
          setError(failure);
          setConfirming(false);
        }
      }}
    >
      <h4>Mark as lost</h4>
      <label className={styles.field}>
        <span>Reason</span>
        <select name="lostReason" value={reason} onChange={(event) => { setReason(event.target.value as LostReason); setConfirming(false); }} data-testid="lost-reason">
          <option value="">Choose…</option>
          {LOST_REASONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
      </label>
      <label className={styles.field}>
        <span>Note {reason === "other" ? "(required)" : "(optional)"}</span>
        <textarea rows={2} maxLength={LOST_NOTE_MAX} value={note} onChange={(event) => { setNote(event.target.value); setConfirming(false); }} data-testid="lost-note" />
        <small>No phone numbers or emails.</small>
      </label>
      {reason && problem ? <p className={styles.error}>{problem}</p> : null}
      {confirming ? <p data-testid="lost-confirm">This closes the proposal. It cannot be shared or accepted afterwards.</p> : null}
      {error ? <p className={styles.error} role="alert" data-testid="lost-error">{error}</p> : null}
      <div className={styles.decisionRow}>
        <button type="submit" className={styles.primary} disabled={Boolean(problem) || working || busy} data-testid="lost-submit">
          {working ? "Saving…" : confirming ? "Confirm: mark lost" : "Mark lost"}
        </button>
        <button type="button" className={styles.secondary} disabled={working} onClick={() => { setOpen(false); setConfirming(false); }}>Cancel</button>
      </div>
    </form>
  );
}
