"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PROPOSAL_COMPONENTS } from "../../../../../lib/proposals/components";
import {
  DISPLAY_NAME_MAX,
  OVERRIDE_REASON_MAX,
  OVERRIDE_REASON_MIN,
  QTY_MAX,
  QTY_MIN,
  ROOMS_MAX,
  ROOMS_MIN,
  VARIANT_MAX,
  clampInt,
  draftProblem,
  formatRupees,
  initialItems,
  pricingKey,
  type BuilderDraft,
  type BuilderItem,
  type ItemState,
  type ItemTier
} from "../../../../../lib/proposals/builder";
import type { ProposalDoc } from "../../../../../lib/proposals/document";
import { localDocument, OFFLINE_BUNDLE_PATH, isOfflineBundle, priceLocally, type OfflineBundle } from "../../../../../lib/proposals/offline/bundle";
import { clearOfflineData, kv, offlineStore } from "../../../../../lib/proposals/offline/idb";
import { isLocalRef, newLocalRef, type AcceptOption, type SyncEvent } from "../../../../../lib/proposals/offline/queue";
import type { PricingResult } from "../../../../../lib/proposals/pricing";
import type { LostReason } from "../../../../../lib/proposals/lost";
import { acceptProposal, markProposalLost, overrideProposal, saveAndPriceProposal, shareProposal, type PriceResult, type DocumentResult, type AcceptResult } from "../actions";
import { AcceptPanel, LostPanel, SyncBadge } from "./decision-panels";
import CustomerActions from "./customer-actions";
import { useOfflineQueue } from "./use-offline-queue";
import styles from "./proposals.module.css";

const STATES: { value: ItemState; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "present", label: "Already present" },
  { value: "declined", label: "Declined" }
];
const TIERS: { value: ItemTier; label: string }[] = [
  { value: "essential", label: "Essential" },
  { value: "addon", label: "Add-on" }
];
/** Quiet period before a change is saved and priced, so a burst of taps or typing is one round (PATCH + price). */
export const PRICE_DEBOUNCE_MS = 400;

type Totals = { essentialPaise: number | null; addonPaise: number | null; priceListVersion: string | null };
type Override = { essentialPaise: number | null; addonPaise: number | null; reason: string };
/** "offline": priced on this tablet from the cached price list; the save is queued and the API re-prices it on sync. */
type Status = { kind: "idle" | "waiting" | "pricing" | "priced" | "offline" | "error"; message?: string };
type Accepted = { option: AcceptOption; commercialCaseId: string | null };
type Lost = { reason: LostReason; note: string; pending: boolean };
/** The open proposal, kept on the tablet while it has queued work, so an offline reload can carry on. */
type OpenProposal = { ref: string; draft: BuilderDraft; local: PricingResult | null; shared: boolean; accepted: Accepted | null; lost: Lost | null; owner: string };
const OPEN_KEY = "open-proposal";
const OWNER_KEY = "owner";

export default function ProposalBuilder({ isAdmin, initialZohoLeadId, today, staffId }: { isAdmin: boolean; initialZohoLeadId: string; today: string; staffId: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<BuilderDraft>({ zohoLeadId: initialZohoLeadId, displayName: "", proposalDate: today, rooms: 1, items: initialItems() });
  // Server id once the API has the draft. `ref` names the proposal in the offline queue: the server id, or a
  // local id for a draft first saved with no signal (mapped to the server id when it syncs).
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [override, setOverride] = useState<Override | null>(null);
  // Bumped when a pricing round finishes, so edits made during it are priced after a fresh debounce.
  const [roundsDone, setRoundsDone] = useState(0);
  const [dateSaved, setDateSaved] = useState(false);
  // Once shared the API locks the proposal (no more PATCH), so editing and re-pricing stop here too.
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [accepted, setAccepted] = useState<Accepted | null>(null);
  const [lost, setLost] = useState<Lost | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [familyShown, setFamilyShown] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [local, setLocal] = useState<PricingResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [bundle, setBundle] = useState<OfflineBundle | null>(null);
  const locked = shared || sharing || accepted !== null || lost !== null || deciding;

  // One pricing request at a time; edits made meanwhile are priced as soon as it returns.
  const inFlight = useRef(false);
  const latestDraft = useRef(draft);
  const lastPricedKey = useRef<string | null>(null);
  // The draft state whose pricing failed. It is never retried automatically: staff tap retry, or edit again.
  const failedKey = useRef<string | null>(null);
  const failedMessage = useRef<string | undefined>(undefined);
  const idRef = useRef<string | null>(null);
  const refRef = useRef<string | null>(null);
  const bundleRef = useRef<OfflineBundle | null>(null);
  latestDraft.current = draft;
  bundleRef.current = bundle;

  // Queue events: the API confirmed something sent from the tablet.
  const onSynced = useCallback((event: SyncEvent) => {
    // The API answered, so the connection is back (a request that failed once may have flagged it as down).
    setOnline(navigator.onLine);
    if (event.op.ref !== refRef.current) return;
    idRef.current = event.serverId;
    setProposalId(event.serverId);
    const data = event.result.data;
    if (event.op.kind === "save") {
      const priced = data as Extract<PriceResult, { ok: true }>;
      if (pricingKey(event.op.draft) === pricingKey(latestDraft.current)) {
        lastPricedKey.current = pricingKey(event.op.draft);
        setTotals((current) => {
          if (current && (current.essentialPaise !== priced.essentialPaise || current.addonPaise !== priced.addonPaise)) {
            setNotice("Synced. The server re-priced this proposal with the latest price list: check the totals before quoting.");
          }
          return { essentialPaise: priced.essentialPaise, addonPaise: priced.addonPaise, priceListVersion: priced.priceListVersion };
        });
        setDateSaved(priced.dateSaved);
        setLocal(null);
        setStatus((current) => (current.kind === "offline" ? { kind: "priced" } : current));
      }
    } else if (event.op.kind === "share") {
      setShareUrl((data as Extract<DocumentResult, { ok: true }>).shareUrl);
    } else if (event.op.kind === "accept") {
      setAccepted({ option: event.op.option, commercialCaseId: (data as Extract<AcceptResult, { ok: true }>).commercialCaseId });
    } else if (event.op.kind === "lost") {
      setLost((current) => (current ? { ...current, pending: false } : current));
    }
  }, []);
  const queue = useOfflineQueue(onSynced);
  // The hook's callbacks are stable; the object around them is not (it carries the counts).
  const { enqueue, sync } = queue;
  // Work on this proposal goes through the queue while anything for it is still waiting, so nothing overtakes it.
  const pendingHere = ref !== null && queue.refs.includes(ref);
  const queueMode = !online || pendingHere || (ref !== null && isLocalRef(ref) && proposalId === null);
  const queueModeRef = useRef(queueMode);
  queueModeRef.current = queueMode;

  // Connection state, the offline bundle (copy, components, price list) and the open proposal after a reload.
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  // The cached (offline) copy of this page is stored without its query string: read the lead id here too.
  useEffect(() => {
    if (initialZohoLeadId) return;
    const fromUrl = new URLSearchParams(window.location.search).get("zohoLeadId");
    if (fromUrl && /^\d{5,30}$/.test(fromUrl)) setDraft((current) => (current.zohoLeadId ? current : { ...current, zohoLeadId: fromUrl }));
  }, [initialZohoLeadId]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Someone else signed in on this tablet: nothing of the previous staff member's stays.
      const owner = await kv.get<string>(OWNER_KEY).catch(() => undefined);
      if (owner && owner !== staffId) await clearOfflineData();
      await kv.set(OWNER_KEY, staffId).catch(() => undefined);
      const open = await kv.get<OpenProposal>(OPEN_KEY).catch(() => undefined);
      if (open && open.owner === staffId && !cancelled) {
        const ops = (await (await offlineStore()).ops()).filter((op) => op.ref === open.ref);
        if (ops.length && !cancelled) {
          refRef.current = open.ref;
          setRef(open.ref);
          setDraft(open.draft);
          setLocal(open.local);
          setShared(open.shared);
          setAccepted(open.accepted);
          setLost(open.lost);
          if (open.local) {
            lastPricedKey.current = pricingKey(open.draft);
            setTotals({ essentialPaise: open.local.essentialTotalPaise, addonPaise: open.local.addonTotalPaise, priceListVersion: open.local.snapshot.version });
            setStatus({ kind: "offline" });
          }
        } else {
          await kv.delete(OPEN_KEY).catch(() => undefined);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffId]);
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    fetch(OFFLINE_BUNDLE_PATH, { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (cancelled || !isOfflineBundle(value) || value.staff.id !== staffId) return;
        setBundle(value);
        // Photos into the service worker's cache now, so Show family and the PDF have them with no signal.
        void import("../../../../../lib/proposals/pdf").then(({ precachePhotos }) =>
          precachePhotos(Object.values(value.content?.components ?? {}).map((component) => component?.photoUrl)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [online, staffId]);
  // Offline with no bundle yet in memory (the page was opened offline): the service worker's copy.
  useEffect(() => {
    if (online || bundle) return;
    fetch(OFFLINE_BUNDLE_PATH, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => (isOfflineBundle(value) && value.staff.id === staffId ? setBundle(value) : undefined))
      .catch(() => undefined);
  }, [online, bundle, staffId]);

  // Keep the open proposal on the tablet while it has queued work; drop it once everything has synced.
  useEffect(() => {
    if (ref === null) return;
    if (!pendingHere && proposalId !== null) {
      void kv.delete(OPEN_KEY).catch(() => undefined);
      return;
    }
    const open: OpenProposal = { ref, draft, local, shared, accepted, lost, owner: staffId };
    void kv.set(OPEN_KEY, open).catch(() => undefined);
  }, [ref, draft, local, shared, accepted, lost, pendingHere, proposalId, staffId]);

  /** Prices on the tablet and queues the save (no signal, or earlier work for this proposal still waiting). */
  const priceOffline = useCallback(async (snapshot: BuilderDraft, key: string) => {
    const priced = priceLocally(snapshot, bundleRef.current);
    if (!priced.ok) {
      setTotals(null);
      setLocal(null);
      lastPricedKey.current = null;
      failedKey.current = key;
      failedMessage.current = priced.error;
      setStatus({ kind: "error", message: priced.error });
      return;
    }
    const proposalRef = refRef.current ?? idRef.current ?? newLocalRef();
    refRef.current = proposalRef;
    setRef(proposalRef);
    await enqueue({ kind: "save", ref: proposalRef, draft: snapshot });
    lastPricedKey.current = key;
    failedKey.current = null;
    setLocal(priced.result);
    setTotals({ essentialPaise: priced.result.essentialTotalPaise, addonPaise: priced.result.addonTotalPaise, priceListVersion: priced.result.snapshot.version });
    setOverride(null);
    setStatus({ kind: "offline" });
    void sync();
  }, [enqueue, sync]);

  const runPricing = useCallback(async () => {
    if (inFlight.current) return;
    const snapshot = latestDraft.current;
    const key = pricingKey(snapshot);
    if (key === lastPricedKey.current || draftProblem(snapshot)) return;
    if (queueModeRef.current) {
      inFlight.current = true;
      await priceOffline(snapshot, key).finally(() => (inFlight.current = false));
      setRoundsDone((count) => count + 1); // after inFlight clears, so edits made meanwhile are priced next
      return;
    }
    failedKey.current = null;
    inFlight.current = true;
    setStatus({ kind: "pricing" });
    let result: PriceResult;
    try {
      result = await saveAndPriceProposal(idRef.current, snapshot);
    } catch {
      // No connection (the request never reached the server): price on the tablet and queue the save.
      setOnline(false);
      await priceOffline(snapshot, key).finally(() => (inFlight.current = false));
      setRoundsDone((count) => count + 1);
      return;
    }
    inFlight.current = false;
    if (result.id) {
      idRef.current = result.id;
      refRef.current ??= result.id;
      setRef((current) => current ?? result.id);
      setProposalId(result.id);
    }
    if (result.ok) {
      lastPricedKey.current = key;
      setTotals({ essentialPaise: result.essentialPaise, addonPaise: result.addonPaise, priceListVersion: result.priceListVersion });
      setOverride(null); // any re-price clears an override on the server
      setDateSaved(result.dateSaved);
      setLocal(null);
      setStatus({ kind: "priced" });
    } else {
      setTotals(null);
      lastPricedKey.current = null; // no priced state remains to restore; returning to it re-prices
      setOverride(null); // the save step may already have cleared it on the server
      failedKey.current = key;
      failedMessage.current = result.error;
      setStatus({ kind: "error", message: result.error });
    }
    setRoundsDone((count) => count + 1);
  }, [priceOffline]);

  const problem = draftProblem(draft);
  const key = pricingKey(draft);
  // Live re-pricing starts only once staff have created the draft explicitly, so a half-typed
  // Zoho Lead ID can never be saved (it is fixed after creation).
  useEffect(() => {
    if (ref === null || problem || inFlight.current || locked) return;
    // An edit undone within the debounce lands back on a known state: restore it rather than stay "waiting".
    if (key === lastPricedKey.current) {
      setStatus((current) => (current.kind === "waiting" ? { kind: "priced" } : current));
      return;
    }
    if (key === failedKey.current) {
      setStatus((current) => (current.kind === "waiting" ? { kind: "error", message: failedMessage.current } : current));
      return;
    }
    setStatus({ kind: "waiting" });
    const timer = setTimeout(() => void runPricing(), PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, problem, ref, roundsDone, runPricing, locked]);

  const retry = () => {
    lastPricedKey.current = null;
    failedKey.current = null;
    void runPricing();
  };
  const stale = ref !== null && status.kind === "error";
  const priced = (status.kind === "priced" || status.kind === "offline") && totals !== null && !stale;

  /** The customer document built on the tablet (no signal): same builder as the server's. */
  const offlineDoc = useCallback((): ProposalDoc | null => {
    const content = bundleRef.current?.content;
    const snapshot = latestDraft.current;
    const pricedHere = local ?? (() => {
      const result = priceLocally(snapshot, bundleRef.current);
      return result.ok ? result.result : null;
    })();
    if (!content || !pricedHere) return null;
    return localDocument(snapshot, pricedHere, content, shared ? "shared" : "draft", override);
  }, [local, override, shared]);

  const queueShare = useCallback(async () => {
    const proposalRef = refRef.current ?? idRef.current;
    if (!proposalRef) throw new Error("Save the proposal first.");
    await enqueue({ kind: "share", ref: proposalRef });
    void sync();
  }, [enqueue, sync]);

  /** "Customer accepts": shares first if needed (the API accepts shared proposals only), then records the option
      and opens the payments case. With no signal both are queued. */
  const accept = useCallback(async (option: AcceptOption): Promise<string | null> => {
    const proposalRef = refRef.current ?? idRef.current;
    if (!proposalRef) return "Save the proposal first.";
    setDeciding(true);
    try {
      if (!queueModeRef.current && idRef.current) {
        try {
          if (!shared) {
            const sharedResult = await shareProposal(idRef.current);
            if (!sharedResult.ok) return sharedResult.error;
            setShared(true);
            setShareUrl(sharedResult.shareUrl);
          }
          const result = await acceptProposal(idRef.current, option);
          if (!result.ok) return result.error;
          setAccepted({ option, commercialCaseId: result.commercialCaseId });
          router.push(`/crm/payments/${encodeURIComponent(result.commercialCaseId)}`);
          return null;
        } catch {
          setOnline(false); // fall through to the queue
        }
      }
      if (!shared) await enqueue({ kind: "share", ref: proposalRef });
      await enqueue({ kind: "accept", ref: proposalRef, option });
      setShared(true);
      setAccepted({ option, commercialCaseId: null });
      void sync();
      return null;
    } finally {
      setDeciding(false);
    }
  }, [enqueue, sync, router, shared]);

  const markLost = useCallback(async (reason: LostReason, note: string): Promise<string | null> => {
    const proposalRef = refRef.current ?? idRef.current;
    if (!proposalRef) return "Save the proposal first.";
    setDeciding(true);
    try {
      if (!queueModeRef.current && idRef.current) {
        try {
          const result = await markProposalLost(idRef.current, reason, note);
          if (!result.ok) return result.error;
          setLost({ reason, note, pending: false });
          return null;
        } catch {
          setOnline(false);
        }
      }
      await enqueue({ kind: "lost", ref: proposalRef, reason, note });
      setLost({ reason, note, pending: true });
      void sync();
      return null;
    } finally {
      setDeciding(false);
    }
  }, [enqueue, sync]);

  const update = (patch: Partial<BuilderDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const updateItem = (index: number, patch: Partial<BuilderItem>) =>
    setDraft((current) => ({ ...current, items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));

  const recommended = draft.items.filter((item) => item.state === "recommended");
  const addonCount = recommended.filter((item) => item.tier === "addon").length;
  const essentialShown = override?.essentialPaise ?? totals?.essentialPaise ?? null;
  const addonShown = override?.addonPaise ?? totals?.addonPaise ?? null;
  const roomsLabel = `${draft.rooms} ${draft.rooms === 1 ? "bathroom" : "bathrooms"}`;

  return (
    <div className={styles.builder}>
      <section className={styles.panel} aria-labelledby="proposal-customer" inert={locked}>
        <h3 id="proposal-customer">Customer</h3>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span>Customer display name</span>
            <input
              name="displayName"
              value={draft.displayName}
              maxLength={DISPLAY_NAME_MAX}
              autoComplete="off"
              placeholder="e.g. Mrs Fernandes"
              onChange={(event) => update({ displayName: event.target.value })}
            />
            <small>How the proposal addresses them. No phone numbers or emails.</small>
          </label>
          <label className={styles.field}>
            <span>Zoho Lead ID</span>
            <input
              name="zohoLeadId"
              value={draft.zohoLeadId}
              inputMode="numeric"
              pattern="[0-9]{5,30}"
              autoComplete="off"
              readOnly={ref !== null}
              onChange={(event) => update({ zohoLeadId: event.target.value.replace(/\D/g, "") })}
            />
            <small>{ref ? "Fixed once the draft is saved." : "Contact details stay in Zoho."}</small>
          </label>
          <label className={styles.field}>
            <span>Proposal date</span>
            <input name="proposalDate" type="date" value={draft.proposalDate} onChange={(event) => update({ proposalDate: event.target.value })} />
            <small data-testid="date-hint">{dateSaved ? "Saved with the draft." : "Shown on the customer page (Phase 2). Not saved by the API yet."}</small>
          </label>
          <div className={styles.field}>
            <span id="rooms-label">Bathrooms covered</span>
            <div className={styles.stepper} role="group" aria-labelledby="rooms-label">
              <button type="button" aria-label="Fewer bathrooms" disabled={draft.rooms <= ROOMS_MIN} onClick={() => update({ rooms: clampInt(draft.rooms - 1, ROOMS_MIN, ROOMS_MAX) })}>−</button>
              <output aria-live="polite" data-testid="rooms-value">{draft.rooms}</output>
              <button type="button" aria-label="More bathrooms" disabled={draft.rooms >= ROOMS_MAX} onClick={() => update({ rooms: clampInt(draft.rooms + 1, ROOMS_MIN, ROOMS_MAX) })}>+</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="proposal-components" inert={locked}>
        <div className={styles.panelHead}>
          <h3 id="proposal-components">Components</h3>
          <p>{recommended.length} recommended · {addonCount} add-on</p>
        </div>
        <ol className={styles.componentList}>
          {draft.items.map((item, index) => {
            const name = PROPOSAL_COMPONENTS[index].name;
            const priced = item.state === "recommended";
            return (
              <li key={item.component} className={styles.componentRow} data-state={item.state} data-testid={`component-${item.component}`}>
                <div className={styles.componentName}>
                  <span className={styles.componentIndex}>{index + 1}</span>
                  <strong>{name}</strong>
                </div>
                <fieldset className={styles.segmented}>
                  <legend className={styles.srOnly}>{name}: assessment</legend>
                  {STATES.map((option) => (
                    <label key={option.value} className={styles.segment}>
                      <input
                        type="radio"
                        name={`state-${item.component}`}
                        value={option.value}
                        checked={item.state === option.value}
                        onChange={() => updateItem(index, { state: option.value })}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className={styles.componentDetails} aria-hidden={!priced}>
                  <div className={styles.qty} role="group" aria-label={`${name}: quantity`}>
                    <button type="button" aria-label={`Fewer ${name}`} disabled={!priced || item.qty <= QTY_MIN} onClick={() => updateItem(index, { qty: clampInt(item.qty - 1, QTY_MIN, QTY_MAX) })}>−</button>
                    <output data-testid={`qty-${item.component}`}>{item.qty}</output>
                    <button type="button" aria-label={`More ${name}`} disabled={!priced || item.qty >= QTY_MAX} onClick={() => updateItem(index, { qty: clampInt(item.qty + 1, QTY_MIN, QTY_MAX) })}>+</button>
                  </div>
                  <label className={styles.variant}>
                    <span className={styles.srOnly}>{name}: variant</span>
                    <input
                      value={item.variant}
                      maxLength={VARIANT_MAX}
                      placeholder="Variant (optional)"
                      disabled={!priced}
                      onChange={(event) => updateItem(index, { variant: event.target.value })}
                    />
                  </label>
                  <fieldset className={styles.segmented} disabled={!priced}>
                    <legend className={styles.srOnly}>{name}: option</legend>
                    {TIERS.map((option) => (
                      <label key={option.value} className={styles.segment}>
                        <input
                          type="radio"
                          name={`tier-${item.component}`}
                          value={option.value}
                          checked={item.tier === option.value}
                          onChange={() => updateItem(index, { tier: option.value })}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <aside className={styles.totals} aria-labelledby="proposal-totals" aria-live="polite">
        <h3 id="proposal-totals">Totals</h3>
        <div className={styles.totalCards} data-stale={stale || undefined} data-updating={status.kind === "waiting" || status.kind === "pricing" || undefined}>
          <div className={styles.totalCard} data-testid="total-essential">
            <span>Essential</span>
            <strong>{formatRupees(essentialShown)}</strong>
          </div>
          <div className={styles.totalCard} data-testid="total-addon">
            <span>Essential + Add-on</span>
            <strong>{addonCount === 0 ? "No add-ons" : formatRupees(addonShown)}</strong>
          </div>
        </div>
        <p className={styles.roomsLine} data-testid="rooms-line">Covers {roomsLabel}. Other rooms: quoted after inspection.</p>
        <SyncBadge count={queue.count} online={online} syncing={queue.syncing} failed={queue.failed} onRetry={() => void queue.sync(true)} onDiscard={() => void queue.discardFailed()} />
        {notice ? <p className={styles.notice} data-testid="sync-notice" role="status">{notice}</p> : null}
        <p className={styles.status} data-status={status.kind} role={status.kind === "error" ? "alert" : undefined}>
          {lost ? `Marked lost (${lost.pending ? "will be recorded when signal returns" : "recorded"}). This proposal is closed.`
            : accepted ? (accepted.commercialCaseId ? "Accepted. The payments case is open for the Razorpay links." : "Accepted on this tablet. It will be recorded, and the payments case opened, when signal returns.")
            : shared ? "Shared with the customer. This proposal is now locked; start a new one for changes."
            : problem ? problem
            : stale ? "The totals above are not current. Do not quote a price until they update."
            : status.kind === "error" ? status.message
            : status.kind === "pricing" ? "Updating totals…"
            : status.kind === "waiting" ? "Totals will update in a moment."
            : status.kind === "priced" ? `Priced with price list ${totals?.priceListVersion ?? "—"}. Draft saved.`
            : status.kind === "offline" ? `No signal: priced on this tablet with price list ${totals?.priceListVersion ?? "—"}. The draft will save when signal returns.`
            : ref === null ? "Check the Zoho Lead ID, then save the draft. Totals update live after that."
            : ""}
        </p>
        {ref === null && (
          <button type="button" className={styles.primary} disabled={Boolean(problem) || status.kind === "pricing"} onClick={retry}>
            {status.kind === "pricing" ? "Saving…" : "Save draft and price"}
          </button>
        )}
        {stale && (
          <button type="button" className={styles.retry} onClick={retry} data-testid="price-retry">
            <strong>Price not updated, tap to retry</strong>
            <span>{status.message}</span>
          </button>
        )}
        {override && <p className={styles.overrideNote} data-testid="override-applied">Admin override applied: {override.reason}</p>}
        {isAdmin && !locked && !queueMode && <AdminOverride proposalId={proposalId} priced={status.kind === "priced" && totals !== null} hasAddon={totals?.addonPaise != null} onApplied={setOverride} />}
        <CustomerActions
          proposalId={proposalId ?? ref}
          ready={priced && lost === null}
          version={`${key}|${override?.essentialPaise ?? ""}|${override?.addonPaise ?? ""}|${roundsDone}|${queueMode ? "local" : "server"}`}
          shared={shared}
          queueMode={queueMode}
          offlineDoc={offlineDoc}
          onQueueShare={queueShare}
          shareUrl={shareUrl}
          onSharing={setSharing}
          onShared={() => setShared(true)}
          onFamilyShown={() => setFamilyShown(true)}
        />
      </aside>
      {ref !== null ? (
        <section className={`${styles.panel} ${styles.decisionPanel}`} aria-labelledby="proposal-decision" data-testid="decision-panel">
          <h3 id="proposal-decision">Customer decision</h3>
          {accepted?.commercialCaseId ? (
            <a className={styles.primary} href={`/crm/payments/${encodeURIComponent(accepted.commercialCaseId)}`} data-testid="open-payments-case">Open the payments case</a>
          ) : null}
          {(familyShown || shared) && priced && !lost ? (
            <AcceptPanel
              accepted={accepted}
              hasAddon={totals?.addonPaise != null}
              essentialPaise={essentialShown}
              addonPaise={addonShown}
              shared={shared}
              blockedReason={override && !isAdmin ? "The price was overridden, so an admin must record the acceptance." : null}
              busy={deciding || sharing}
              onAccept={accept}
            />
          ) : null}
          {ref !== null && !accepted ? <LostPanel lost={lost} busy={deciding || sharing} onLost={markLost} /> : null}
          {!accepted && !lost && !(familyShown || shared) ? <p className={styles.decisionHint}>Show the family the proposal to record their decision.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

function AdminOverride({ proposalId, priced, hasAddon, onApplied }: { proposalId: string | null; priced: boolean; hasAddon: boolean; onApplied: (override: Override) => void }) {
  const [essentialRupees, setEssentialRupees] = useState("");
  const [addonRupees, setAddonRupees] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const reasonOk = reason.trim().length >= OVERRIDE_REASON_MIN;
  const amountGiven = Boolean(essentialRupees.trim() || addonRupees.trim());

  return (
    <form
      className={styles.override}
      data-testid="admin-override"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!proposalId) return;
        setSaving(true);
        setError(null);
        const result = await overrideProposal(proposalId, { essentialRupees, addonRupees, reason }, hasAddon);
        setSaving(false);
        if (result.ok) {
          onApplied({ essentialPaise: result.essentialPaise, addonPaise: result.addonPaise, reason: result.reason });
          setEssentialRupees("");
          setAddonRupees("");
          setReason("");
        } else {
          setError(result.error);
        }
      }}
    >
      <h4>Admin price override</h4>
      <p>Replaces a computed total. The computed price stays on record. Any later edit re-prices and clears it.</p>
      <label className={styles.field}>
        <span>Essential (₹)</span>
        <input inputMode="decimal" value={essentialRupees} disabled={!priced} onChange={(event) => setEssentialRupees(event.target.value)} />
      </label>
      {hasAddon && (
        <label className={styles.field}>
          <span>Essential + Add-on (₹)</span>
          <input inputMode="decimal" value={addonRupees} disabled={!priced} onChange={(event) => setAddonRupees(event.target.value)} />
        </label>
      )}
      <label className={styles.field}>
        <span>Reason (required)</span>
        <textarea required minLength={OVERRIDE_REASON_MIN} maxLength={OVERRIDE_REASON_MAX} rows={3} value={reason} disabled={!priced} onChange={(event) => setReason(event.target.value)} />
        <small>At least {OVERRIDE_REASON_MIN} characters.</small>
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.primary} disabled={!priced || !reasonOk || !amountGiven || saving}>
        {saving ? "Saving…" : "Apply override"}
      </button>
    </form>
  );
}
