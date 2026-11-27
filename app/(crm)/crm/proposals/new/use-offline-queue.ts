"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { kv, offlineStore } from "../../../../../lib/proposals/offline/idb";
import { enqueue as addOp, syncQueue, type Executors, type Op, type OpResult, type QueuedOp, type SyncEvent } from "../../../../../lib/proposals/offline/queue";
import { acceptProposal, markProposalLost, saveAndPriceProposal, shareProposal } from "../actions";

/* Drives the offline queue from the staff screen: counts what is waiting, sends it when the connection returns
   (the browser's online event, a 20 s retry while anything waits, and on demand), and reports each op the API
   confirmed so the screen can pick up server ids, totals, the share link and the payments case. */

const RETRY_MS = 20_000;
const LOCK = "mason-proposals-sync";
const LEASE_KEY = "sync-lease";
const LEASE_MS = 60_000;
/** Attempts that threw while the browser reports online before staff are asked to reload (an out-of-date page
    after a deploy calls server actions that no longer exist). */
const STALE_AFTER = 3;
const TAB = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random());

const fromResult = (result: { ok: boolean; error?: string; retryable?: boolean; id?: string | null }, data: unknown, id?: string | null): OpResult =>
  result.ok ? { status: "done", id: id ?? undefined, data }
    : result.retryable ? { status: "offline", id }
    : { status: "failed", error: result.error ?? "Refused by the server.", id };

const executors: Executors = {
  async save(serverId, draft) {
    if (!navigator.onLine) return { status: "offline" };
    const result = await saveAndPriceProposal(serverId, draft);
    const outcome = fromResult(result, result, result.id);
    return outcome.status === "done" && result.ok ? { ...outcome, totals: { essentialPaise: result.essentialPaise, addonPaise: result.addonPaise } } : outcome;
  },
  async share(serverId) {
    if (!navigator.onLine) return { status: "offline" };
    const result = await shareProposal(serverId);
    if (result.ok && !result.shareUrl) return { status: "failed", error: "The proposal was not shared." };
    return fromResult(result, result);
  },
  async accept(serverId, option) {
    if (!navigator.onLine) return { status: "offline" };
    const result = await acceptProposal(serverId, option);
    return fromResult(result, result);
  },
  async lost(serverId, reason, note) {
    if (!navigator.onLine) return { status: "offline" };
    const result = await markProposalLost(serverId, reason, note);
    return fromResult(result, result);
  }
};

export type QueueState = { count: number; refs: string[]; failedRefs: string[]; syncing: boolean; failed: string | null; stale: boolean };

/** Browsers without Web Locks (Safari before 15.4): a lease in IndexedDB so two tabs do not sync at once. */
async function withLease(run: () => Promise<void>) {
  const now = Date.now();
  const lease = await kv.get<{ tab: string; until: number }>(LEASE_KEY).catch(() => undefined);
  if (lease && lease.tab !== TAB && lease.until > now) return;
  await kv.set(LEASE_KEY, { tab: TAB, until: now + LEASE_MS }).catch(() => undefined);
  const check = await kv.get<{ tab: string }>(LEASE_KEY).catch(() => undefined);
  if (check && check.tab !== TAB) return;
  try {
    await run();
  } finally {
    await kv.delete(LEASE_KEY).catch(() => undefined);
  }
}

export function useOfflineQueue(onDone: (event: SyncEvent) => void) {
  const [state, setState] = useState<QueueState>({ count: 0, refs: [], failedRefs: [], syncing: false, failed: null, stale: false });
  const running = useRef(false);
  const strikes = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  const refresh = useCallback(async () => {
    const ops = await (await offlineStore()).ops();
    const failed = ops.find((op) => op.error)?.error ?? null;
    setState((current) => ({ ...current, count: ops.length, refs: [...new Set(ops.map((op) => op.ref))], failedRefs: ops.filter((op) => op.error).map((op) => op.ref), failed }));
    return ops.length;
  }, []);

  const runOnce = useCallback(async (retryFailed: boolean) => {
    const store = await offlineStore();
    if ((await store.ops()).length === 0) return;
    setState((current) => ({ ...current, syncing: true }));
    try {
      const outcome = await syncQueue(store, executors, { retryFailed, onDone: (event) => done.current(event) });
      strikes.current = outcome.state === "offline" && outcome.thrown && navigator.onLine ? strikes.current + 1 : outcome.done > 0 || outcome.state !== "offline" ? 0 : strikes.current;
      setState((current) => ({ ...current, stale: strikes.current >= STALE_AFTER }));
    } finally {
      setState((current) => ({ ...current, syncing: false }));
      await refresh();
    }
  }, [refresh]);

  /** Sends what is queued. One sync per device at a time: other tabs skip while one runs. */
  const sync = useCallback(async (retryFailed = false) => {
    if (running.current || typeof navigator === "undefined" || !navigator.onLine) return;
    running.current = true;
    try {
      if (navigator.locks?.request) await navigator.locks.request(LOCK, { ifAvailable: true }, async (lock) => (lock ? runOnce(retryFailed) : undefined));
      else await withLease(() => runOnce(retryFailed));
    } catch {
      // A failed sync leaves everything queued; the next attempt retries.
    } finally {
      running.current = false;
    }
  }, [runOnce]);

  const enqueue = useCallback(async (op: Op) => {
    await addOp(await offlineStore(), op);
    await refresh();
  }, [refresh]);

  /** Drops the op the server refused (staff chose to discard it) and returns it, so the screen can undo it. */
  const discardFailed = useCallback(async (): Promise<QueuedOp | null> => {
    const store = await offlineStore();
    const failed = (await store.ops()).find((op) => op.error) ?? null;
    if (failed) await store.remove(failed.seq);
    await refresh();
    return failed;
  }, [refresh]);

  useEffect(() => {
    void refresh().then((count) => (count ? sync() : undefined));
    const online = () => void sync();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [refresh, sync]);

  useEffect(() => {
    // Keep retrying while any proposal still has work that is not held back by a refusal.
    const sendable = state.refs.some((ref) => !state.failedRefs.includes(ref));
    if (state.count === 0 || !sendable) return;
    const timer = window.setInterval(() => void sync(), RETRY_MS);
    return () => window.clearInterval(timer);
  }, [state.count, state.refs, state.failedRefs, sync]);

  return { ...state, enqueue, sync, discardFailed, refresh };
}
