/* IndexedDB backing for the offline queue, plus the one open proposal (restored after an offline reload) and
   the clean-up run on logout. Browser only. */

import { memoryStore, type OfflineStore, type QueuedOp } from "./queue";

const DB_NAME = "mason-proposals-offline";
const DB_VERSION = 1;
const OPS = "ops";
const KV = "kv";
/** Cache names the service worker uses (public/proposals-sw.js); all start with this. */
export const SW_CACHE_PREFIX = "mason-proposals-";

let opened: Promise<IDBDatabase> | null = null;

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function open(): Promise<IDBDatabase> {
  opened ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OPS)) db.createObjectStore(OPS, { keyPath: "seq", autoIncrement: true });
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };
    req.onsuccess = () => {
      const db = req.result;
      // Another tab deleting the database (logout) must not be blocked by this connection.
      db.onversionchange = () => {
        db.close();
        opened = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  }).catch((error) => {
    opened = null;
    throw error;
  });
  return opened;
}

async function tx<T>(store: string, mode: IDBTransactionMode, run: (objects: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  const transaction = db.transaction(store, mode);
  const result = await request(run(transaction.objectStore(store)));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  return result;
}

export const kv = {
  get: <T>(key: string) => tx<T | undefined>(KV, "readonly", (objects) => objects.get(key) as IDBRequest<T | undefined>),
  set: (key: string, value: unknown) => tx(KV, "readwrite", (objects) => objects.put(value, key)).then(() => undefined),
  delete: (key: string) => tx(KV, "readwrite", (objects) => objects.delete(key)).then(() => undefined)
};

const idbStore: OfflineStore = {
  async ops() {
    const all = await tx<QueuedOp[]>(OPS, "readonly", (objects) => objects.getAll() as IDBRequest<QueuedOp[]>);
    return all.sort((a, b) => a.seq - b.seq);
  },
  add: (op) => tx(OPS, "readwrite", (objects) => objects.add(op)).then((key) => Number(key)),
  put: (op) => tx(OPS, "readwrite", (objects) => objects.put(op)).then(() => undefined),
  remove: (seq) => tx(OPS, "readwrite", (objects) => objects.delete(seq)).then(() => undefined),
  // Read and delete in one readwrite transaction, so a newer draft merged in between is never deleted.
  async removeIfVersion(seq, version) {
    const db = await open();
    const transaction = db.transaction(OPS, "readwrite");
    const objects = transaction.objectStore(OPS);
    const removed = await new Promise<boolean>((resolve, reject) => {
      const get = objects.get(seq);
      get.onerror = () => reject(get.error);
      get.onsuccess = () => {
        const op = get.result as QueuedOp | undefined;
        if (!op || (op.version ?? 0) !== version) return resolve(false);
        const del = objects.delete(seq);
        del.onerror = () => reject(del.error);
        del.onsuccess = () => resolve(true);
      };
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return removed;
  },
  serverId: async (ref) => (await kv.get<string>(`id:${ref}`)) ?? null,
  setServerId: (ref, id) => kv.set(`id:${ref}`, id)
};

let chosen: Promise<OfflineStore> | null = null;

/** IndexedDB when it works, else an in-memory store (the queue then lasts only while the page is open). */
export function offlineStore(): Promise<OfflineStore> {
  chosen ??= (async () => {
    try {
      if (typeof indexedDB === "undefined") throw new Error("no indexedDB");
      await open();
      return idbStore;
    } catch {
      return memoryStore();
    }
  })();
  return chosen;
}

const isProposalsWorker = (registration: ServiceWorkerRegistration) =>
  [registration.active, registration.waiting, registration.installing].some((worker) => worker?.scriptURL.endsWith("/proposals-sw.js"));

/**
 * Logout: drop the queue, the open proposal and every service worker cache, and unregister the worker.
 * `keepWorker` (a different staff member on the same tablet): data and the customer page go, but the worker
 * and its app shell stay, so the new staff member keeps offline support. Resolves within `timeoutMs`.
 */
export async function clearOfflineData({ keepWorker = false, timeoutMs = 2_000 }: { keepWorker?: boolean; timeoutMs?: number } = {}): Promise<void> {
  const work = (async () => {
    opened?.then((db) => db.close()).catch(() => undefined);
    opened = null;
    chosen = null;
    const doomed = (name: string) => name.startsWith(SW_CACHE_PREFIX) && !(keepWorker && name.startsWith(`${SW_CACHE_PREFIX}shell-`));
    await Promise.allSettled([
      typeof indexedDB === "undefined" ? Promise.resolve() : request(indexedDB.deleteDatabase(DB_NAME)).catch(() => undefined),
      typeof caches === "undefined" ? Promise.resolve() : caches.keys().then((names) => Promise.all(names.filter(doomed).map((name) => caches.delete(name)))),
      keepWorker ? Promise.resolve() : navigator.serviceWorker?.getRegistrations?.().then((registrations) => Promise.all(registrations.filter(isProposalsWorker).map((registration) => {
        registration.active?.postMessage({ type: "clear" });
        return registration.unregister();
      })))
    ]);
  })();
  await Promise.race([work, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

/** Whether this browser holds any proposals offline data (checked on every sign-out, flag on or off, so data
    from before the flag was turned off is still cleared). Never creates the database. */
export async function hasOfflineData(): Promise<boolean> {
  try {
    const [registrations, names, databases] = await Promise.all([
      navigator.serviceWorker?.getRegistrations?.() ?? Promise.resolve([] as readonly ServiceWorkerRegistration[]),
      typeof caches === "undefined" ? Promise.resolve([] as string[]) : caches.keys(),
      typeof indexedDB !== "undefined" && typeof indexedDB.databases === "function" ? indexedDB.databases() : Promise.resolve(null)
    ]);
    return registrations.some(isProposalsWorker) || names.some((name) => name.startsWith(SW_CACHE_PREFIX))
      || databases === null || databases.some((db) => db.name === DB_NAME);
  } catch {
    return true;
  }
}

/** Queued items, for the logout warning (0 when there is no database; never creates one). */
export async function pendingCount(): Promise<number> {
  try {
    if (typeof indexedDB === "undefined") return 0;
    if (typeof indexedDB.databases === "function" && !(await indexedDB.databases()).some((db) => db.name === DB_NAME)) return 0;
    return (await idbStore.ops()).length;
  } catch {
    return 0;
  }
}
