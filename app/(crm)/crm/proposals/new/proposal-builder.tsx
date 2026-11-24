"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { overrideProposal, saveAndPriceProposal } from "../actions";
import CustomerActions from "./customer-actions";
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
type Status = { kind: "idle" | "waiting" | "pricing" | "priced" | "error"; message?: string };

export default function ProposalBuilder({ isAdmin, initialZohoLeadId, today }: { isAdmin: boolean; initialZohoLeadId: string; today: string }) {
  const [draft, setDraft] = useState<BuilderDraft>({ zohoLeadId: initialZohoLeadId, displayName: "", proposalDate: today, rooms: 1, items: initialItems() });
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [override, setOverride] = useState<Override | null>(null);
  // Bumped when a pricing round finishes, so edits made during it are priced after a fresh debounce.
  const [roundsDone, setRoundsDone] = useState(0);
  const [dateSaved, setDateSaved] = useState(false);
  // Once shared the API locks the proposal (no more PATCH), so editing and re-pricing stop here too.
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const locked = shared || sharing;

  // One pricing request at a time; edits made meanwhile are priced as soon as it returns.
  const inFlight = useRef(false);
  const latestDraft = useRef(draft);
  const lastPricedKey = useRef<string | null>(null);
  // The draft state whose pricing failed. It is never retried automatically: staff tap retry, or edit again.
  const failedKey = useRef<string | null>(null);
  const failedMessage = useRef<string | undefined>(undefined);
  const idRef = useRef<string | null>(null);
  latestDraft.current = draft;

  const runPricing = useCallback(async () => {
    if (inFlight.current) return;
    const snapshot = latestDraft.current;
    const key = pricingKey(snapshot);
    if (key === lastPricedKey.current || draftProblem(snapshot)) return;
    failedKey.current = null;
    inFlight.current = true;
    setStatus({ kind: "pricing" });
    const result = await saveAndPriceProposal(idRef.current, snapshot);
    inFlight.current = false;
    if (result.id) {
      idRef.current = result.id;
      setProposalId(result.id);
    }
    if (result.ok) {
      lastPricedKey.current = key;
      setTotals({ essentialPaise: result.essentialPaise, addonPaise: result.addonPaise, priceListVersion: result.priceListVersion });
      setOverride(null); // any re-price clears an override on the server
      setDateSaved(result.dateSaved);
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
  }, []);

  const problem = draftProblem(draft);
  const key = pricingKey(draft);
  // Live re-pricing starts only once staff have created the draft explicitly, so a half-typed
  // Zoho Lead ID can never be saved (it is fixed after creation).
  useEffect(() => {
    if (proposalId === null || problem || inFlight.current || locked) return;
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
  }, [key, problem, proposalId, roundsDone, runPricing, locked]);

  const retry = () => {
    lastPricedKey.current = null;
    failedKey.current = null;
    void runPricing();
  };
  const stale = proposalId !== null && status.kind === "error";

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
              readOnly={proposalId !== null}
              onChange={(event) => update({ zohoLeadId: event.target.value.replace(/\D/g, "") })}
            />
            <small>{proposalId ? "Fixed once the draft is saved." : "Contact details stay in Zoho."}</small>
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
        <p className={styles.status} data-status={status.kind} role={status.kind === "error" ? "alert" : undefined}>
          {shared ? "Shared with the customer. This proposal is now locked; start a new one for changes."
            : problem ? problem
            : stale ? "The totals above are not current. Do not quote a price until they update."
            : status.kind === "error" ? status.message
            : status.kind === "pricing" ? "Updating totals…"
            : status.kind === "waiting" ? "Totals will update in a moment."
            : status.kind === "priced" ? `Priced with price list ${totals?.priceListVersion ?? "—"}. Draft saved.`
            : proposalId === null ? "Check the Zoho Lead ID, then save the draft. Totals update live after that."
            : ""}
        </p>
        {proposalId === null && (
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
        {isAdmin && !shared && <AdminOverride proposalId={proposalId} priced={status.kind === "priced" && totals !== null} hasAddon={totals?.addonPaise != null} onApplied={setOverride} />}
        <CustomerActions
          proposalId={proposalId}
          ready={status.kind === "priced" && totals !== null && !stale}
          version={`${key}|${override?.essentialPaise ?? ""}|${override?.addonPaise ?? ""}|${roundsDone}`}
          shared={shared}
          onSharing={setSharing}
          onShared={() => setShared(true)}
        />
      </aside>
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
