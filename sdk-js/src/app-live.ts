// Self-refreshing reads of app items by conditional polling. One poller serves every watcher
// of the same resource and link; it asks with If-None-Match, so an unchanged item costs one
// 304. Polling pauses while the page is hidden, resumes at once when it is shown again, and
// backs off while requests fail.

import type { AppConditionalRead, AppItemError } from "./app-items.js";

export const APP_LIVE_STATUSES = {
  /** No answer yet. */
  loading: "loading",
  /** The last poll confirmed the data. */
  fresh: "fresh",
  /** The last poll confirmed there is nothing yet, such as no forecast run. */
  empty: "empty",
  /** The data is from an earlier poll; the last one failed and is being retried. */
  stale: "stale",
  /** The last poll got no answer; retried with backoff and as soon as the browser is online. */
  offline: "offline",
  /** Refused (link revoked or expired, key refused), or failing before any data arrived. */
  error: "error",
} as const;

export type AppLiveStatus = (typeof APP_LIVE_STATUSES)[keyof typeof APP_LIVE_STATUSES];

/**
 * A watched read. `lastUpdatedAt` is when the server last confirmed the data, including a 304.
 * Data from an earlier poll is kept through stale, offline and error states.
 */
export type AppLiveState<T> =
  | { status: typeof APP_LIVE_STATUSES.loading }
  | { status: typeof APP_LIVE_STATUSES.fresh; data: T; lastUpdatedAt: Date }
  | { status: typeof APP_LIVE_STATUSES.empty; lastUpdatedAt: Date }
  | { status: typeof APP_LIVE_STATUSES.stale; data: T; lastUpdatedAt: Date; error: AppItemError }
  | { status: typeof APP_LIVE_STATUSES.offline; data?: T; lastUpdatedAt?: Date; error: AppItemError }
  | {
      status: typeof APP_LIVE_STATUSES.error;
      data?: T;
      lastUpdatedAt?: Date;
      error: AppItemError;
      /** False when retrying cannot help; polling has stopped until `refresh()`. */
      retrying: boolean;
    };

export type AppLiveWatchOptions = {
  /** Read an item of the presented link collection by its UUID. */
  item?: string;
  /** Poll interval; the first watcher of a shared poller sets it. Default 5000. */
  intervalMs?: number;
  /** Longest wait between retries while polls fail. Default 60000. */
  maxBackoffMs?: number;
};

/** A handle on a shared poller. Polling runs while at least one listener is subscribed. */
export type AppLiveWatch<T> = {
  getState: () => AppLiveState<T>;
  subscribe: (listener: () => void) => () => void;
  /** Polls now, for example after a change made elsewhere. */
  refresh: () => void;
};

export const APP_LIVE_DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_MAX_BACKOFF_MS = 60_000;

const LOADING: AppLiveState<never> = Object.freeze({ status: APP_LIVE_STATUSES.loading });

/** A conditional read, or an answer that there is nothing to read yet. */
export type AppLiveRead<T> = AppConditionalRead<T> | { status: typeof APP_LIVE_STATUSES.empty };

type Loader<T> = (etag: string | undefined) => Promise<AppLiveRead<T>>;

class AppLivePoller<T> {
  state: AppLiveState<T> = LOADING;
  private readonly listeners = new Set<() => void>();
  private etag: string | undefined;
  private data: { value: T; at: Date } | undefined;
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inFlight = false;
  private again = false;
  private halted = false;
  private readonly onVisibility = () => {
    if (pageHidden()) this.clearTimer();
    else if (!this.halted) this.pollNow();
  };
  private readonly onOnline = () => {
    if (!this.halted) this.pollNow();
  };

  constructor(
    readonly token: string,
    private readonly load: Loader<T>,
    private readonly intervalMs: number,
    private readonly maxBackoffMs: number,
  ) {}

  get idle(): boolean {
    return this.listeners.size === 0;
  }

  add(listener: () => void): void {
    this.listeners.add(listener);
    if (this.listeners.size > 1) return;
    globalThis.document?.addEventListener("visibilitychange", this.onVisibility);
    globalThis.addEventListener?.("online", this.onOnline);
    if (!pageHidden()) void this.poll();
  }

  remove(listener: () => void): void {
    this.listeners.delete(listener);
    if (this.listeners.size > 0) return;
    this.clearTimer();
    globalThis.document?.removeEventListener("visibilitychange", this.onVisibility);
    globalThis.removeEventListener?.("online", this.onOnline);
  }

  /** Polls now, and resumes polling stopped by a refusal. */
  pollNow(): void {
    this.halted = false;
    if (this.idle || pageHidden()) return;
    this.clearTimer();
    void this.poll();
  }

  private async poll(): Promise<void> {
    if (this.inFlight) {
      this.again = true;
      return;
    }
    this.inFlight = true;
    try {
      this.succeed(await this.load(this.etag));
    } catch (error) {
      this.fail(error as AppItemError);
    } finally {
      this.inFlight = false;
    }
    if (this.idle) return;
    if (this.again) {
      this.again = false;
      void this.poll();
      return;
    }
    this.schedule();
  }

  private succeed(read: AppLiveRead<T>): void {
    this.failures = 0;
    const at = new Date();
    if (read.status === APP_LIVE_STATUSES.empty) {
      // Only a 200 carries an ETag worth repeating: an empty answer must be asked for again.
      this.etag = undefined;
      this.data = undefined;
      this.publish({ status: APP_LIVE_STATUSES.empty, lastUpdatedAt: at });
      return;
    }
    if (read.status === "modified") {
      this.etag = read.etag ?? undefined;
      this.data = { value: read.data, at };
    } else if (this.data) {
      this.data = { value: this.data.value, at };
    }
    if (this.data) this.publish({ status: APP_LIVE_STATUSES.fresh, data: this.data.value, lastUpdatedAt: at });
  }

  private fail(error: AppItemError): void {
    this.failures += 1;
    const kept = this.data ? { data: this.data.value, lastUpdatedAt: this.data.at } : {};
    if (error.terminal) {
      this.halted = true;
      this.publish({ status: APP_LIVE_STATUSES.error, error, retrying: false, ...kept });
    } else if (error.status === null) {
      this.publish({ status: APP_LIVE_STATUSES.offline, error, ...kept });
    } else if (this.data) {
      this.publish({ status: APP_LIVE_STATUSES.stale, error, data: this.data.value, lastUpdatedAt: this.data.at });
    } else {
      this.publish({ status: APP_LIVE_STATUSES.error, error, retrying: true });
    }
  }

  private schedule(): void {
    this.clearTimer();
    if (this.halted || pageHidden()) return;
    const delay = Math.min(this.intervalMs * 2 ** this.failures, Math.max(this.maxBackoffMs, this.intervalMs));
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.poll();
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private publish(state: AppLiveState<T>): void {
    this.state = state;
    for (const listener of [...this.listeners]) listener();
  }
}

/** The pollers of one client, keyed by resource, collection item and link. */
export class AppLiveRegistry {
  private readonly pollers = new Map<string, AppLivePoller<unknown>>();

  watch<T>(key: string, token: string, options: AppLiveWatchOptions, load: Loader<T>): AppLiveWatch<T> {
    const interval = options.intervalMs ?? APP_LIVE_DEFAULT_INTERVAL_MS;
    const maxBackoff = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    const current = () => this.pollers.get(key) as AppLivePoller<T> | undefined;
    return {
      getState: () => current()?.state ?? LOADING,
      subscribe: (listener) => {
        let poller = current();
        if (!poller) {
          poller = new AppLivePoller<T>(token, load, interval, maxBackoff);
          this.pollers.set(key, poller as AppLivePoller<unknown>);
        }
        const subscribed = poller;
        subscribed.add(listener);
        return () => {
          subscribed.remove(listener);
          if (subscribed.idle && this.pollers.get(key) === subscribed) this.pollers.delete(key);
        };
      },
      refresh: () => current()?.pollNow(),
    };
  }

  /** Polls every watched read now. */
  refreshAll(): void {
    for (const poller of this.pollers.values()) poller.pollNow();
  }

  /** Polls every watched read of this link now, after a change made through it. */
  refreshToken(token: string): void {
    for (const poller of this.pollers.values()) {
      if (poller.token === token) poller.pollNow();
    }
  }
}

function pageHidden(): boolean {
  return globalThis.document?.hidden === true;
}
