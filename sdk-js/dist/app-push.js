// Pushed "item changed" for watched app reads. One WebSocket per client carries every watched
// item: it says hello with the Site key, subscribes each watched read with its link or user
// token, and on `subscribed` or `item.changed` asks that read's poller to poll now, so the read
// itself still goes through the conditional GET. While the socket is down or refused, the poller's
// own timer runs as before; the socket reconnects with backoff and resubscribes everything.
export const APP_REALTIME_PATH = "/api/v1/realtime";
const OPEN = 1;
const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
/** The server refused the hello or the frame: retrying cannot help until the page reloads. */
const CLOSE_REFUSED = 1008;
export class AppPushChannel {
    constructor(url, siteKey, createSocket) {
        this.url = url;
        this.siteKey = siteKey;
        this.createSocket = createSocket;
        this.entries = new Map();
        this.ready = false;
        this.refused = false;
        this.retries = 0;
        this.nextName = 0;
    }
    /** Starts pushing changes for one watched read; the returned function stops it. */
    watch(target, events) {
        this.nextName += 1;
        const entry = { name: `w${this.nextName}`, target, events };
        this.entries.set(entry.name, entry);
        if (this.ready)
            this.subscribe(entry);
        else
            this.connect();
        return () => this.unwatch(entry);
    }
    /**
     * Resubscribes every read whose signed-in user's token changed since it subscribed, so a
     * sign-in, refresh or sign-out does not leave the server checking a token the page dropped.
     */
    refreshCredentials() {
        if (!this.ready)
            return;
        for (const entry of this.entries.values()) {
            if (entry.target.userToken() === entry.sentUserToken)
                continue;
            this.sendFrame({ type: "unsubscribe", subscription: entry.name });
            this.subscribe(entry);
        }
    }
    unwatch(entry) {
        if (!this.entries.delete(entry.name))
            return;
        if (this.ready)
            this.sendFrame({ type: "unsubscribe", subscription: entry.name });
        if (this.entries.size === 0)
            this.disconnect();
    }
    connect() {
        if (this.socket || this.retryTimer || this.refused || this.entries.size === 0)
            return;
        let socket;
        try {
            socket = this.createSocket(this.url);
        }
        catch {
            this.refused = true;
            return;
        }
        this.socket = socket;
        socket.onopen = () => this.sendFrame({ type: "hello", mode: "app", siteKey: this.siteKey });
        socket.onmessage = (event) => this.receive(event.data);
        socket.onclose = (event) => this.closed(socket, event.code);
        socket.onerror = () => undefined;
    }
    disconnect() {
        this.clearRetry();
        const socket = this.socket;
        this.socket = undefined;
        this.ready = false;
        this.retries = 0;
        socket?.close(1000, "no watched reads");
    }
    receive(data) {
        const frame = parseFrame(data);
        if (!frame)
            return;
        if (frame.type === "ready") {
            this.ready = true;
            this.retries = 0;
            for (const entry of this.entries.values())
                this.subscribe(entry);
            return;
        }
        const entry = typeof frame.subscription === "string" ? this.entries.get(frame.subscription) : undefined;
        if (!entry)
            return;
        if (frame.type === "subscribed") {
            entry.events.pushed(true);
            entry.events.changed();
        }
        else if (frame.type === "item.changed") {
            entry.events.changed();
        }
        else if (frame.type === "refused") {
            // A user token that rotated since it subscribed is tried once more with the new one;
            // otherwise the read's own poll reports why, and it keeps polling on its timer.
            if (entry.target.userToken() !== entry.sentUserToken)
                this.subscribe(entry);
            else
                entry.events.pushed(false);
        }
    }
    subscribe(entry) {
        entry.sentUserToken = entry.target.userToken();
        this.sendFrame({
            type: "subscribe",
            subscription: entry.name,
            linkToken: entry.target.linkToken,
            userToken: entry.sentUserToken,
            item: entry.target.item,
        });
    }
    closed(socket, code) {
        if (this.socket !== socket)
            return;
        this.socket = undefined;
        this.ready = false;
        for (const entry of this.entries.values())
            entry.events.pushed(false);
        if (code === CLOSE_REFUSED) {
            this.refused = true;
            return;
        }
        this.scheduleReconnect();
    }
    scheduleReconnect() {
        if (this.entries.size === 0 || this.retryTimer)
            return;
        const delay = Math.min(MIN_RETRY_MS * 2 ** this.retries, MAX_RETRY_MS);
        this.retries += 1;
        this.retryTimer = setTimeout(() => {
            this.retryTimer = undefined;
            this.connect();
        }, delay);
    }
    clearRetry() {
        if (this.retryTimer !== undefined)
            clearTimeout(this.retryTimer);
        this.retryTimer = undefined;
    }
    sendFrame(frame) {
        if (this.socket?.readyState === OPEN)
            this.socket.send(JSON.stringify(frame));
    }
}
/** The realtime URL for an API origin: the same host, over ws(s). */
export function appRealtimeUrl(apiBaseUrl) {
    const url = new URL(`${apiBaseUrl.replace(/\/+$/, "")}${APP_REALTIME_PATH}`);
    url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
    return url.toString();
}
/** The global WebSocket as a factory, or undefined where there is none. */
export function globalWebSocketFactory() {
    const WebSocketClass = globalThis.WebSocket;
    return WebSocketClass ? (url) => new WebSocketClass(url) : undefined;
}
function parseFrame(data) {
    if (typeof data !== "string")
        return undefined;
    try {
        const frame = JSON.parse(data);
        return typeof frame === "object" && frame !== null ? frame : undefined;
    }
    catch {
        return undefined;
    }
}
