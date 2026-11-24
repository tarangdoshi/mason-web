/* Customer-page telemetry → mason-api `POST /api/v1/public/proposals/:token/events` (docs/proposals.md).
   No cookies: requests are `credentials: "omit"`, and the page sets none. The body is JSON sent as text/plain
   (a CORS "simple" request, which the API reads as JSON), fire-and-forget. */

export type ViewerEvent =
  | { type: "opened" }
  | { type: "viewed"; durationMs: number }
  | { type: "option_chosen"; option: "essential" | "addon" };

export const HEARTBEAT_MS = 15_000;
/** Matches the API's per-event ceiling; one heartbeat never claims more than this. */
export const MAX_VIEW_MS = 4 * 60 * 60 * 1000;
/** Shorter visible spells than this are not worth an event when the page is hidden. */
export const MIN_FLUSH_MS = 1_000;

export function eventsUrl(apiBase: string, token: string): string {
  return `${apiBase.replace(/\/$/, "")}/api/v1/public/proposals/${encodeURIComponent(token)}/events`;
}

export function sendViewerEvent(url: string, event: ViewerEvent, fetcher: typeof fetch = fetch): void {
  try {
    void fetcher(url, {
      method: "POST",
      mode: "no-cors",
      credentials: "omit",
      keepalive: true,
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(event)
    }).catch(() => undefined);
  } catch {
    // Telemetry never breaks the page.
  }
}

type DntSources = { navigator?: { doNotTrack?: string | null; msDoNotTrack?: string | null }; window?: { doNotTrack?: string | null } };

/** True when the browser sends Do Not Track (heartbeats are then not sent). */
export function doNotTrack(sources: DntSources): boolean {
  const values = [sources.navigator?.doNotTrack, sources.navigator?.msDoNotTrack, sources.window?.doNotTrack];
  return values.some((value) => value === "1" || value === "yes");
}

type HeartbeatEnv = {
  send: (durationMs: number) => void;
  isVisible: () => boolean;
  now: () => number;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (handle: unknown) => void;
  intervalMs?: number;
};

/**
 * "viewed" heartbeats: every 15 s while the page is visible, one event carrying the visible time since the
 * previous one (so durations add up to total reading time). Call `visibilityChanged()` on visibilitychange /
 * pagehide; hidden time is never counted. Returns a stop function that flushes the last partial spell.
 */
export function startHeartbeat(env: HeartbeatEnv) {
  let since: number | null = env.isVisible() ? env.now() : null;
  const flush = (minimum: number) => {
    if (since === null) return;
    const elapsed = Math.min(env.now() - since, MAX_VIEW_MS);
    if (elapsed >= minimum) {
      env.send(Math.round(elapsed));
      since = env.now();
    }
  };
  const handle = env.setInterval(() => {
    if (env.isVisible()) flush(1);
  }, env.intervalMs ?? HEARTBEAT_MS);
  return {
    /** pagehide (also into the back/forward cache): stop counting even though the page may still report visible. */
    pageHidden() {
      flush(MIN_FLUSH_MS);
      since = null;
    },
    /** pageshow (including a return from the back/forward cache). */
    pageShown() {
      if (env.isVisible() && since === null) since = env.now();
    },
    visibilityChanged() {
      if (env.isVisible()) {
        if (since === null) since = env.now();
      } else {
        flush(MIN_FLUSH_MS);
        since = null;
      }
    },
    stop() {
      env.clearInterval(handle);
      flush(MIN_FLUSH_MS);
      since = null;
    }
  };
}
