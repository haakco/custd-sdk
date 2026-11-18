// Self-refreshing reads of app items by conditional polling. One poller serves every watcher
// of the same resource and link; it asks with If-None-Match, so an unchanged item costs one
// 304. Polling pauses while the page is hidden, resumes at once when it is shown again, and
// backs off while requests fail.
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
};
export const APP_LIVE_DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_MAX_BACKOFF_MS = 60000;
const LOADING = Object.freeze({ status: APP_LIVE_STATUSES.loading });
class AppLivePoller {
    constructor(token, load, intervalMs, maxBackoffMs) {
        this.token = token;
        this.load = load;
        this.intervalMs = intervalMs;
        this.maxBackoffMs = maxBackoffMs;
        this.state = LOADING;
        this.listeners = new Set();
        this.failures = 0;
        this.inFlight = false;
        this.again = false;
        this.halted = false;
        this.onVisibility = () => {
            if (pageHidden())
                this.clearTimer();
            else if (!this.halted)
                this.pollNow();
        };
        this.onOnline = () => {
            if (!this.halted)
                this.pollNow();
        };
    }
    get idle() {
        return this.listeners.size === 0;
    }
    add(listener) {
        this.listeners.add(listener);
        if (this.listeners.size > 1)
            return;
        globalThis.document?.addEventListener("visibilitychange", this.onVisibility);
        globalThis.addEventListener?.("online", this.onOnline);
        if (!pageHidden())
            void this.poll();
    }
    remove(listener) {
        this.listeners.delete(listener);
        if (this.listeners.size > 0)
            return;
        this.clearTimer();
        globalThis.document?.removeEventListener("visibilitychange", this.onVisibility);
        globalThis.removeEventListener?.("online", this.onOnline);
    }
    /** Polls now, and resumes polling stopped by a refusal. */
    pollNow() {
        this.halted = false;
        if (this.idle || pageHidden())
            return;
        this.clearTimer();
        void this.poll();
    }
    async poll() {
        if (this.inFlight) {
            this.again = true;
            return;
        }
        this.inFlight = true;
        try {
            this.succeed(await this.load(this.etag));
        }
        catch (error) {
            this.fail(error);
        }
        finally {
            this.inFlight = false;
        }
        if (this.idle)
            return;
        if (this.again) {
            this.again = false;
            void this.poll();
            return;
        }
        this.schedule();
    }
    succeed(read) {
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
        }
        else if (this.data) {
            this.data = { value: this.data.value, at };
        }
        if (this.data)
            this.publish({ status: APP_LIVE_STATUSES.fresh, data: this.data.value, lastUpdatedAt: at });
    }
    fail(error) {
        this.failures += 1;
        const kept = this.data ? { data: this.data.value, lastUpdatedAt: this.data.at } : {};
        if (error.terminal) {
            this.halted = true;
            this.publish({ status: APP_LIVE_STATUSES.error, error, retrying: false, ...kept });
        }
        else if (error.status === null) {
            this.publish({ status: APP_LIVE_STATUSES.offline, error, ...kept });
        }
        else if (this.data) {
            this.publish({ status: APP_LIVE_STATUSES.stale, error, data: this.data.value, lastUpdatedAt: this.data.at });
        }
        else {
            this.publish({ status: APP_LIVE_STATUSES.error, error, retrying: true });
        }
    }
    schedule() {
        this.clearTimer();
        if (this.halted || pageHidden())
            return;
        const delay = Math.min(this.intervalMs * 2 ** this.failures, Math.max(this.maxBackoffMs, this.intervalMs));
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.poll();
        }, delay);
    }
    clearTimer() {
        if (this.timer !== undefined)
            clearTimeout(this.timer);
        this.timer = undefined;
    }
    publish(state) {
        this.state = state;
        for (const listener of [...this.listeners])
            listener();
    }
}
/** The pollers of one client, keyed by resource, collection item and link. */
export class AppLiveRegistry {
    constructor() {
        this.pollers = new Map();
    }
    watch(key, token, options, load) {
        const interval = options.intervalMs ?? APP_LIVE_DEFAULT_INTERVAL_MS;
        const maxBackoff = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
        const current = () => this.pollers.get(key);
        return {
            getState: () => current()?.state ?? LOADING,
            subscribe: (listener) => {
                let poller = current();
                if (!poller) {
                    poller = new AppLivePoller(token, load, interval, maxBackoff);
                    this.pollers.set(key, poller);
                }
                const subscribed = poller;
                subscribed.add(listener);
                return () => {
                    subscribed.remove(listener);
                    if (subscribed.idle && this.pollers.get(key) === subscribed)
                        this.pollers.delete(key);
                };
            },
            refresh: () => current()?.pollNow(),
        };
    }
    /** Polls every watched read now. */
    refreshAll() {
        for (const poller of this.pollers.values())
            poller.pollNow();
    }
    /** Polls every watched read of this link now, after a change made through it. */
    refreshToken(token) {
        for (const poller of this.pollers.values()) {
            if (poller.token === token)
                poller.pollNow();
        }
    }
}
function pageHidden() {
    return globalThis.document?.hidden === true;
}
