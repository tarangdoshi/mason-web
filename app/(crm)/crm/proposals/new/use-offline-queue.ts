"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { offlineStore } from "../../../../../lib/proposals/offline/idb";
import { enqueue as addOp, syncQueue, type Executors, type Op, type OpResult, type SyncEvent } from "../../../../../lib/proposals/offline/queue";
import { acceptProposal, markProposalLost, saveAndPriceProposal, shareProposal } from "../actions";

/* Drives the offline queue from the staff screen: counts what is waiting, sends it when the connection returns
   (the browser's online event, a 20 s retry while anything waits, and on demand), and reports each op the API
   confirmed so the screen can pick up server ids, totals, the share link and the payments case. */

const RETRY_MS = 20_000;
const LOCK = "mason-proposals-sync";

const fromResult = (result: { ok: boolean; error?: string; retryable?: boolean; id?: string | null }, data: unknown, id?: string | null): OpResult =>
  result.ok ? { status: "done", id: id ?? undefined, data }
    : result.retryable ? { status: "offline", id }
    : { status: "failed", error: result.error ?? "Refused by the server.", id };

const executors: Executors = {
  async save(serverId, draft) {
    if (!navigator.onLine) return { status: "offline" };
    const result = await saveAndPriceProposal(serverId, draft);
    return fromResult(result, result, result.id);
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

export type QueueState = { count: number; refs: string[]; syncing: boolean; failed: string | null };

export function useOfflineQueue(onDone: (event: SyncEvent) => void) {
  const [state, setState] = useState<QueueState>({ count: 0, refs: [], syncing: false, failed: null });
  const running = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;

  const refresh = useCallback(async () => {
    const ops = await (await offlineStore()).ops();
    const failed = ops.find((op) => op.error)?.error ?? null;
    setState((current) => ({ ...current, count: ops.length, refs: [...new Set(ops.map((op) => op.ref))], failed }));
    return ops.length;
  }, []);

  const runOnce = useCallback(async (retryFailed: boolean) => {
    const store = await offlineStore();
    if ((await store.ops()).length === 0) return;
    setState((current) => ({ ...current, syncing: true }));
    try {
      await syncQueue(store, executors, { retryFailed, onDone: (event) => done.current(event) });
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
      else await runOnce(retryFailed);
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

  /** Drops the op the server refused (staff chose to discard it). */
  const discardFailed = useCallback(async () => {
    const store = await offlineStore();
    const failed = (await store.ops()).find((op) => op.error);
    if (failed) await store.remove(failed.seq);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh().then((count) => (count ? sync() : undefined));
    const online = () => void sync();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [refresh, sync]);

  useEffect(() => {
    if (state.count === 0 || state.failed) return;
    const timer = window.setInterval(() => void sync(), RETRY_MS);
    return () => window.clearInterval(timer);
  }, [state.count, state.failed, sync]);

  return { ...state, enqueue, sync, discardFailed, refresh };
}
