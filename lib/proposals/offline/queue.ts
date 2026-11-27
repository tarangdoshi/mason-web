/* Offline queue for the staff Proposal Builder: saves, shares, accepts and "lost" made with no signal are kept
   on the tablet (IndexedDB, see ./idb.ts) and sent in order when the connection returns. Pure logic over a
   small store interface, so it is unit-tested without a browser.

   No duplicates: a sync sends one op at a time and removes it only once the API confirmed it AND it was not
   changed meanwhile (a save edited while being sent keeps its newer draft and is sent again). The server id of
   a proposal created offline is recorded before anything else, so a retried op PATCHes instead of creating
   again. Share and accept are idempotent on the API (same option), so replaying either is harmless.
   A refused op holds back only the later ops of the same proposal; other proposals still sync. */

import type { BuilderDraft } from "../builder";
import type { LostReason } from "../lost";

export type AcceptOption = "essential" | "essential_addon";
export type Totals = { essentialPaise: number | null; addonPaise: number | null };

export type Op =
  /** `expected`: the totals staff saw on the tablet; if the API prices differently, a queued share or accept
      for this proposal waits for staff to check the new price with the family. */
  | { kind: "save"; ref: string; draft: BuilderDraft; expected?: Totals | null }
  | { kind: "share"; ref: string }
  | { kind: "accept"; ref: string; option: AcceptOption }
  | { kind: "lost"; ref: string; reason: LostReason; note: string };

/** `version` goes up each time a queued save takes a newer draft. */
export type QueuedOp = Op & { seq: number; queuedAt: number; version?: number; error?: string };

export interface OfflineStore {
  /** All queued ops, oldest first. */
  ops(): Promise<QueuedOp[]>;
  add(op: Op & { queuedAt: number }): Promise<number>;
  put(op: QueuedOp): Promise<void>;
  remove(seq: number): Promise<void>;
  serverId(ref: string): Promise<string | null>;
  setServerId(ref: string, id: string): Promise<void>;
}

/** What one op did. `offline`: no connection (or a passing server problem): stop and try again later. */
export type OpResult =
  | { status: "done"; id?: string; data?: unknown; totals?: Totals }
  | { status: "offline"; id?: string | null }
  | { status: "failed"; error: string; id?: string | null };

export type Executors = {
  save: (serverId: string | null, draft: BuilderDraft) => Promise<OpResult>;
  share: (serverId: string) => Promise<OpResult>;
  accept: (serverId: string, option: AcceptOption) => Promise<OpResult>;
  lost: (serverId: string, reason: LostReason, note: string) => Promise<OpResult>;
};

export const LOCAL_PREFIX = "local:";
export const isLocalRef = (ref: string) => ref.startsWith(LOCAL_PREFIX);

export function newLocalRef(random: () => string = () => crypto.randomUUID()): string {
  return `${LOCAL_PREFIX}${random()}`;
}

export const PRICE_CHANGED = "The server priced this proposal differently from the tablet. Check the new totals with the family, then tap Try again to share.";

/**
 * Adds an op. A save replaces the proposal's queued save when nothing for that proposal was queued after it
 * (only the latest draft matters), so a long offline session is one save, not hundreds.
 */
export async function enqueue(store: OfflineStore, op: Op, now: () => number = Date.now): Promise<void> {
  if (op.kind === "save") {
    const forRef = (await store.ops()).filter((queued) => queued.ref === op.ref);
    const last = forRef.at(-1);
    if (last && last.kind === "save") {
      await store.put({ ...last, draft: op.draft, expected: op.expected ?? null, queuedAt: now(), version: (last.version ?? 0) + 1, error: undefined });
      return;
    }
  }
  await store.add({ ...op, queuedAt: now() });
}

export type SyncEvent = { op: QueuedOp; serverId: string; result: Extract<OpResult, { status: "done" }> };
export type SyncOutcome = {
  state: "idle" | "offline" | "failed";
  done: number;
  remaining: number;
  error?: string;
  /** The last attempt threw (rather than the server answering): with the browser online, that can mean the
      page is out of date after a deploy. */
  thrown?: boolean;
};

const differs = (a: Totals | null | undefined, b: Totals | undefined) =>
  Boolean(a && b && (a.essentialPaise !== b.essentialPaise || a.addonPaise !== b.addonPaise));

/** Sends queued ops in order. Stops entirely when offline. A refused op keeps its error and holds back the
    later ops of its proposal until staff retry or discard it; `retryFailed` clears earlier refusals. */
export async function syncQueue(store: OfflineStore, executors: Executors, options: { onDone?: (event: SyncEvent) => void; retryFailed?: boolean; maxSteps?: number } = {}): Promise<SyncOutcome> {
  let done = 0;
  let firstError: string | undefined;
  const blocked = new Set<string>();
  if (options.retryFailed) {
    for (const op of await store.ops()) if (op.error) await store.put({ ...op, error: undefined });
  }
  for (let step = 0; step < (options.maxSteps ?? 500); step += 1) {
    const ops = await store.ops();
    const op = ops.find((queued) => !blocked.has(queued.ref));
    if (!op) break;
    if (op.error) {
      blocked.add(op.ref);
      firstError ??= op.error;
      continue;
    }
    const known = isLocalRef(op.ref) ? await store.serverId(op.ref) : op.ref;
    if (op.kind !== "save" && !known) {
      const error = "The proposal was not saved first.";
      await store.put({ ...op, error });
      blocked.add(op.ref);
      firstError ??= error;
      continue;
    }
    let result: OpResult;
    let thrown = false;
    try {
      result = op.kind === "save" ? await executors.save(known, op.draft)
        : op.kind === "share" ? await executors.share(known!)
        : op.kind === "accept" ? await executors.accept(known!, op.option)
        : await executors.lost(known!, op.reason, op.note);
    } catch {
      result = { status: "offline" };
      thrown = true;
    }
    // A create that went through before a later step failed still has its id: keep it, so the retry PATCHes.
    const id = result.id ?? null;
    if (id && isLocalRef(op.ref) && id !== known) await store.setServerId(op.ref, id);
    if (result.status === "offline") {
      return thrown ? { state: "offline", done, remaining: ops.length, thrown } : { state: "offline", done, remaining: ops.length };
    }
    if (result.status === "failed") {
      await store.put({ ...op, error: result.error });
      blocked.add(op.ref);
      firstError ??= result.error;
      continue;
    }
    // Remove only what was sent: a save that took a newer draft meanwhile stays, and goes next.
    const current = (await store.ops()).find((queued) => queued.seq === op.seq);
    if (current && (current.version ?? 0) === (op.version ?? 0)) await store.remove(op.seq);
    done += 1;
    options.onDone?.({ op, serverId: id ?? known!, result });
    // Offline price ≠ server price: hold the proposal's queued share/accept for staff to check.
    if (op.kind === "save" && current && (current.version ?? 0) === (op.version ?? 0) && differs(op.expected, result.totals)) {
      const next = (await store.ops()).find((queued) => queued.ref === op.ref);
      if (next && (next.kind === "share" || next.kind === "accept")) {
        await store.put({ ...next, error: PRICE_CHANGED });
        blocked.add(op.ref);
        firstError ??= PRICE_CHANGED;
      }
    }
  }
  const remaining = (await store.ops()).length;
  return firstError ? { state: "failed", done, remaining, error: firstError } : { state: "idle", done, remaining };
}

/** In-memory store (tests, and the fallback when IndexedDB is unavailable, e.g. a private window). */
export function memoryStore(): OfflineStore & { dump: () => { ops: QueuedOp[]; ids: Record<string, string> } } {
  let seq = 0;
  const ops = new Map<number, QueuedOp>();
  const ids = new Map<string, string>();
  return {
    async ops() { return [...ops.values()].sort((a, b) => a.seq - b.seq).map((op) => ({ ...op })); },
    async add(op) { seq += 1; ops.set(seq, { ...op, seq } as QueuedOp); return seq; },
    async put(op) { ops.set(op.seq, { ...op }); },
    async remove(key) { ops.delete(key); },
    async serverId(ref) { return ids.get(ref) ?? null; },
    async setServerId(ref, id) { ids.set(ref, id); },
    dump: () => ({ ops: [...ops.values()], ids: Object.fromEntries(ids) })
  };
}
