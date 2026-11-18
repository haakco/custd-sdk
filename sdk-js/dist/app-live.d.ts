import type { AppConditionalRead, AppItemError } from "./app-items.js";
export declare const APP_LIVE_STATUSES: {
    /** No answer yet. */
    readonly loading: "loading";
    /** The last poll confirmed the data. */
    readonly fresh: "fresh";
    /** The last poll confirmed there is nothing yet, such as no forecast run. */
    readonly empty: "empty";
    /** The data is from an earlier poll; the last one failed and is being retried. */
    readonly stale: "stale";
    /** The last poll got no answer; retried with backoff and as soon as the browser is online. */
    readonly offline: "offline";
    /** Refused (link revoked or expired, key refused), or failing before any data arrived. */
    readonly error: "error";
};
export type AppLiveStatus = (typeof APP_LIVE_STATUSES)[keyof typeof APP_LIVE_STATUSES];
/**
 * A watched read. `lastUpdatedAt` is when the server last confirmed the data, including a 304.
 * Data from an earlier poll is kept through stale, offline and error states.
 */
export type AppLiveState<T> = {
    status: typeof APP_LIVE_STATUSES.loading;
} | {
    status: typeof APP_LIVE_STATUSES.fresh;
    data: T;
    lastUpdatedAt: Date;
} | {
    status: typeof APP_LIVE_STATUSES.empty;
    lastUpdatedAt: Date;
} | {
    status: typeof APP_LIVE_STATUSES.stale;
    data: T;
    lastUpdatedAt: Date;
    error: AppItemError;
} | {
    status: typeof APP_LIVE_STATUSES.offline;
    data?: T;
    lastUpdatedAt?: Date;
    error: AppItemError;
} | {
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
export declare const APP_LIVE_DEFAULT_INTERVAL_MS = 5000;
/** A conditional read, or an answer that there is nothing to read yet. */
export type AppLiveRead<T> = AppConditionalRead<T> | {
    status: typeof APP_LIVE_STATUSES.empty;
};
type Loader<T> = (etag: string | undefined) => Promise<AppLiveRead<T>>;
/** The pollers of one client, keyed by resource, collection item and link. */
export declare class AppLiveRegistry {
    private readonly pollers;
    watch<T>(key: string, token: string, options: AppLiveWatchOptions, load: Loader<T>): AppLiveWatch<T>;
    /** Polls every watched read now. */
    refreshAll(): void;
    /** Polls every watched read of this link now, after a change made through it. */
    refreshToken(token: string): void;
}
export {};
