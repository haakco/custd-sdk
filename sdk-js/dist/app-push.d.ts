/** The part of the browser WebSocket this channel uses. */
export type AppWebSocket = {
    readonly readyState: number;
    onopen: ((event: unknown) => void) | null;
    onmessage: ((event: {
        data: unknown;
    }) => void) | null;
    onclose: ((event: {
        code: number;
    }) => void) | null;
    onerror: ((event: unknown) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
};
/** Builds a socket for a URL; `globalThis.WebSocket` is the default. */
export type AppWebSocketFactory = (url: string) => AppWebSocket;
/** What one watched read sends when it subscribes. Tokens are read at every (re)subscribe. */
export type AppPushTarget = {
    linkToken?: string;
    item?: string;
    userToken: () => string | undefined;
};
/** What the channel tells a watched read. */
export type AppPushEvents = {
    /** The item changed, or the subscription (re)started: poll now. */
    changed: () => void;
    /** Push is carrying this read (true) or not (false); while false the read polls on its timer. */
    pushed: (on: boolean) => void;
};
export declare const APP_REALTIME_PATH = "/api/v1/realtime";
export declare class AppPushChannel {
    private readonly url;
    private readonly siteKey;
    private readonly createSocket;
    private readonly random;
    private readonly entries;
    private socket;
    private ready;
    private refused;
    private retries;
    private retryTimer;
    private nextName;
    constructor(url: string, siteKey: string, createSocket: AppWebSocketFactory, random?: () => number);
    /** Starts pushing changes for one watched read; the returned function stops it. */
    watch(target: AppPushTarget, events: AppPushEvents): () => void;
    /**
     * Resubscribes every read whose signed-in user's token changed since it subscribed, so a
     * sign-in, refresh or sign-out does not leave the server checking a token the page dropped.
     */
    refreshCredentials(): void;
    private unwatch;
    private connect;
    private disconnect;
    private receive;
    private subscribe;
    private closed;
    private scheduleReconnect;
    private clearRetry;
    private sendFrame;
}
/** The realtime URL for an API origin: the same host, over ws(s). */
export declare function appRealtimeUrl(apiBaseUrl: string): string;
/** The global WebSocket as a factory, or undefined where there is none. */
export declare function globalWebSocketFactory(): AppWebSocketFactory | undefined;
