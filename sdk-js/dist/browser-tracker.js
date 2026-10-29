import { applyEnvironmentLabel, LocalStorageQueueStorage, MemoryQueueStorage, normalizeRetryOptions, prepareEvent, RetryableError, validateBrowserEvent, withRetry, } from "./index.js";
const defaultSchemaVersion = "1.0.0";
const maxQueuedGlobalCalls = 1000;
const redactedPathSegment = "[redacted]";
const safePathSegment = /^[A-Za-z][A-Za-z0-9._~-]{0,63}$/u;
const uuidPathSegment = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const opaquePathSegment = /^[A-Za-z0-9_-]{24,}$/u;
const poweredByProjectSlug = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const safeRoutePathSegment = /^[A-Za-z0-9._~:{}*[\]-]*$/u;
const maxRoutePathLength = 1024;
const maxPageTitleLength = 200;
const retryableCollectorStatuses = new Set([408, 429, 500, 502, 503, 504]);
export function createBrowserTracker(config) {
    return new DefaultBrowserTracker(config);
}
class DefaultBrowserTracker {
    constructor(config) {
        this.queue = [];
        this.installedSpaTracking = false;
        this.lastTrackedPath = null;
        this.originalPushState = null;
        this.originalReplaceState = null;
        this.onlineHandler = () => this.detach("flush", () => this.flush());
        this.pagehideHandler = () => this.flushWithKeepalive();
        this.popstateHandler = () => this.detachPathChange(() => this.trackPageView());
        this.config = config;
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.queueStorage = config.queueStorage ?? browserQueueStorage(config.siteUuid, config.persistentQueue === true);
        this.retry = normalizeRetryOptions(config.retry);
        this.maxQueueSize = config.maxQueueSize ?? 1000;
        this.queue = this.queueStorage.load();
        this.trimQueue();
        this.consent = config.consent === "required" ? "denied" : "granted";
        if (this.trackingDisabled()) {
            this.clearStoredState();
        }
        assertSecureOrLocalHTTP(this.baseUrl, "baseUrl");
        assertAllowedOrigin(config);
        window.addEventListener("online", this.onlineHandler);
        window.addEventListener("pagehide", this.pagehideHandler);
    }
    async track(eventTypeSlug, payload = {}) {
        if (this.trackingDisabled()) {
            return;
        }
        const event = this.buildEvent(eventTypeSlug, payload);
        if ((this.config.batchSize ?? 0) > 1) {
            this.enqueue(event);
            if (this.queue.length >= (this.config.batchSize ?? 0)) {
                await this.flush();
            }
            return;
        }
        await this.sendEvent(event);
    }
    trackPageView() {
        this.lastTrackedPath = window.location.pathname;
        return this.track("page-view", poweredByAttribution());
    }
    installSpaTracking() {
        if (this.installedSpaTracking) {
            return;
        }
        this.installedSpaTracking = true;
        this.originalPushState = window.history.pushState;
        this.originalReplaceState = window.history.replaceState;
        window.history.pushState = this.wrapHistoryMethod(this.originalPushState);
        window.history.replaceState = this.wrapHistoryMethod(this.originalReplaceState);
        window.addEventListener("popstate", this.popstateHandler);
        if (this.config.trackInitialPageView !== false) {
            this.detach("page-view", () => this.trackPageView());
        }
    }
    setConsent(state) {
        this.consent = state;
        if (state === "denied") {
            this.clearStoredState();
        }
    }
    async flush() {
        if (this.trackingDisabled()) {
            this.clearStoredState();
            return;
        }
        if (this.queue.length === 0 || !isOnline()) {
            return;
        }
        const events = this.queue.splice(0, this.queue.length);
        let outcome;
        try {
            outcome = await this.sendBatch(events);
        }
        catch (error) {
            this.queue.unshift(...events);
            this.trimQueue();
            this.queueStorage.save(this.queue);
            throw error;
        }
        this.applyBatchOutcome("flush", outcome);
        if (outcome.retryable.length > 0) {
            throw new RetryableCollectorStatusError(outcome.retryableStatus ?? 503);
        }
    }
    close() {
        window.removeEventListener("online", this.onlineHandler);
        window.removeEventListener("pagehide", this.pagehideHandler);
        window.removeEventListener("popstate", this.popstateHandler);
        if (this.originalPushState) {
            window.history.pushState = this.originalPushState;
        }
        if (this.originalReplaceState) {
            window.history.replaceState = this.originalReplaceState;
        }
        this.installedSpaTracking = false;
        this.originalPushState = null;
        this.originalReplaceState = null;
    }
    wrapHistoryMethod(original) {
        return ((...args) => {
            const previousPath = window.location.pathname;
            const result = original.apply(window.history, args);
            if (window.location.pathname !== previousPath) {
                this.detach("page-view", () => this.trackPageView());
            }
            return result;
        });
    }
    trackingDisabled() {
        if (this.consent !== "granted") {
            return true;
        }
        if (doNotTrackEnabled()) {
            return true;
        }
        return false;
    }
    enqueue(event) {
        this.queue.push(event);
        this.trimQueue();
        this.queueStorage.save(this.queue);
    }
    trimQueue() {
        if (this.queue.length > this.maxQueueSize) {
            this.queue = this.queue.slice(this.queue.length - this.maxQueueSize);
        }
    }
    clearStoredState() {
        this.queue = [];
        this.queueStorage.clear();
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(anonymousIDStorageKey(this.config.siteUuid));
            localStorage.removeItem(queueStorageKey(this.config.siteUuid));
        }
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(sessionIDStorageKey(this.config.siteUuid));
        }
    }
    buildEvent(eventTypeSlug, payload) {
        const identity = this.identityFields();
        const event = {
            eventTypeSlug,
            schemaVersion: defaultSchemaVersion,
            timestamp: new Date().toISOString(),
            ...identity,
            context: browserContext(this.pageContext()),
            payload: {
                siteUuid: this.config.siteUuid,
                ...payload,
            },
        };
        const mode = this.config.identityMode === "extended" ? "producer" : "browser-cookieless";
        const prepared = prepareEvent(event, { mode });
        validateBrowserEvent(prepared);
        applyEnvironmentLabel(prepared, this.config.environment);
        return prepared;
    }
    identityFields() {
        if (this.config.identityMode !== "extended") {
            return { anonymousId: "", sessionId: "" };
        }
        return {
            anonymousId: storedUUID(anonymousIDStorageKey(this.config.siteUuid), localStorage),
            sessionId: storedUUID(sessionIDStorageKey(this.config.siteUuid), sessionStorage),
        };
    }
    async sendEvent(event) {
        await withRetry(this.retry, async () => {
            const response = await fetch(`${this.baseUrl}/api/v1/collect/events`, {
                method: "POST",
                headers: collectorHeaders(this.config.writeKey),
                body: JSON.stringify(event),
                credentials: "omit",
            });
            assertAccepted(response);
        });
    }
    async sendBatch(events, keepalive = false) {
        const results = await withRetry(this.retry, async () => {
            const response = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
                method: "POST",
                headers: collectorHeaders(this.config.writeKey),
                body: JSON.stringify({ events }),
                credentials: "omit",
                keepalive,
            });
            assertAccepted(response);
            return readCollectorBatchResults(response, events.length);
        });
        return classifyBatchResults(events, results);
    }
    /** Settle the queue and report permanent rejections for an answered batch. */
    applyBatchOutcome(source, outcome) {
        if (outcome.retryable.length > 0) {
            this.queue.unshift(...outcome.retryable);
            this.trimQueue();
        }
        this.queueStorage.save(this.queue);
        if (outcome.rejected.length > 0) {
            this.notifyFailure({ source, rejectedEvents: outcome.rejected.length });
        }
    }
    pageContext() {
        const defaults = {
            path: sanitizeBrowserPath(window.location.pathname),
            title: document.title,
        };
        const provider = this.config.pageContext;
        if (!provider) {
            return defaults;
        }
        let provided;
        try {
            provided = provider(defaults);
        }
        catch {
            // A provider that cannot describe the page must not fall back to page content.
            return {};
        }
        return safePageContext(provided, defaults.path);
    }
    /**
     * Run a fire-and-forget tracker call whose rejection has nowhere to go.
     *
     * SPA and lifecycle call sites cannot return a promise to the host page, so an unhandled rejection there would
     * surface as a page-level error in the consumer's console while the queue already retains undelivered events for
     * the next retry. The failure is absorbed here and reported as a sanitized `onFailure` description instead.
     */
    detach(source, operation) {
        void operation().catch((error) => this.notifyFailure({ source, status: collectorStatus(error) }));
    }
    /** Track a popstate only when it lands on a different route path. */
    detachPathChange(operation) {
        if (window.location.pathname === this.lastTrackedPath) {
            return;
        }
        this.detach("page-view", operation);
    }
    notifyFailure(failure) {
        const onFailure = this.config.onFailure;
        if (!onFailure) {
            return;
        }
        try {
            // An async callback is valid for a void signature. Absorb its rejection
            // without awaiting, so queue settlement never depends on the observer.
            void Promise.resolve(onFailure(failure)).catch(() => undefined);
        }
        catch {
            // A consumer callback must never break tracking or mask the original failure.
        }
    }
    flushWithKeepalive() {
        if (this.trackingDisabled()) {
            this.clearStoredState();
            return;
        }
        if (this.queue.length === 0) {
            return;
        }
        const events = this.queue.splice(0, this.queue.length);
        void this.sendBatch(events, true).then((outcome) => {
            this.applyBatchOutcome("flush", outcome);
            if (outcome.retryable.length > 0) {
                this.notifyFailure({ source: "flush", status: outcome.retryableStatus ?? 503 });
            }
        }, (error) => {
            this.queue.unshift(...events);
            this.trimQueue();
            this.queueStorage.save(this.queue);
            this.notifyFailure({ source: "flush", status: collectorStatus(error) });
        });
    }
}
function anonymousIDStorageKey(siteUuid) {
    return `custd:${siteUuid}:anonymous_id`;
}
function sessionIDStorageKey(siteUuid) {
    return `custd:${siteUuid}:session_id`;
}
function queueStorageKey(siteUuid) {
    return `custd:${siteUuid}:event_queue`;
}
export async function installBrowserTrackerFromScript(scriptElement) {
    const script = scriptElement ?? currentScript();
    const queuedGlobal = installQueuedGlobal();
    try {
        const siteUuid = script.dataset.siteUuid;
        const writeKey = script.dataset.writeKey;
        if (!siteUuid || !writeKey) {
            throw new Error("custd: browser script requires data-site-uuid and data-write-key");
        }
        const baseUrl = script.dataset.baseUrl ?? new URL(script.src).origin;
        assertSecureOrLocalHTTP(baseUrl, "baseUrl");
        const siteConfig = await fetchSiteConfig(baseUrl, siteUuid);
        const tracker = createBrowserTracker({
            baseUrl,
            siteUuid,
            writeKey,
            identityMode: siteConfig.identityMode,
            allowedOrigins: siteConfig.allowedOrigins,
            batchSize: Number(script.dataset.batchSize || defaultScriptBatchSize(siteConfig)),
            consent: scriptConsent(script, siteConfig),
            persistentQueue: script.dataset.persistentQueue === "true",
        });
        window.custd = {
            track: (eventTypeSlug, payload) => tracker.track(eventTypeSlug, payload),
            trackPageView: () => tracker.trackPageView(),
            setConsent: (state) => tracker.setConsent(state),
        };
        await drainQueuedGlobal(tracker, queuedGlobal);
        return tracker;
    }
    catch (error) {
        rejectQueuedGlobal(queuedGlobal, error);
        installRejectingGlobal(error);
        throw error;
    }
}
async function fetchSiteConfig(baseUrl, siteUuid) {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(siteUuid)}/config`, {
        credentials: "omit",
    });
    if (!response.ok) {
        throw new Error(`custd: site config request failed with status ${response.status}`);
    }
    return (await response.json());
}
function browserContext(page) {
    const context = {
        device: { type: deviceType() },
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (page.path !== undefined || page.title !== undefined) {
        context.page = page;
    }
    return context;
}
/** Apply a supplied page context, never forwarding a value the collector must not receive. */
function safePageContext(provided, fallbackPath) {
    const page = {};
    if (typeof provided?.path === "string") {
        page.path = isSafeRoutePath(provided.path) ? provided.path : fallbackPath;
    }
    const title = sanitizePageTitle(provided?.title);
    if (title !== undefined) {
        page.title = title;
    }
    return page;
}
/**
 * A route path or template: absolute, without scheme, query, fragment, or
 * encoded bytes. Colon, brace, bracket, and star placeholders are allowed so a
 * router can name the dynamic segment instead of sending its value.
 */
function isSafeRoutePath(path) {
    if (path.length === 0 || path.length > maxRoutePathLength || !path.startsWith("/") || path.startsWith("//")) {
        return false;
    }
    return path.split("/").every((segment) => safeRoutePathSegment.test(segment));
}
function sanitizePageTitle(title) {
    if (typeof title !== "string") {
        return undefined;
    }
    const cleaned = title.replace(/[\p{Cc}]/gu, "").trim();
    return cleaned === "" ? undefined : cleaned.slice(0, maxPageTitleLength);
}
function poweredByAttribution() {
    const query = new URL(window.location.href).searchParams;
    const project = query.get("ref") ?? "";
    if (query.get("source") !== "powered-by" || !poweredByProjectSlug.test(project)) {
        return {};
    }
    return { utmSource: project, utmMedium: "powered-by" };
}
function sanitizeBrowserPath(pathname) {
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const segments = path.split("/").map(sanitizePathSegment);
    return segments.join("/") || "/";
}
function sanitizePathSegment(segment) {
    if (segment === "") {
        return "";
    }
    let decoded;
    try {
        decoded = decodeURIComponent(segment);
    }
    catch {
        return redactedPathSegment;
    }
    if (!safePathSegment.test(decoded) ||
        uuidPathSegment.test(decoded) ||
        /^\d+$/u.test(decoded) ||
        opaquePathSegment.test(decoded)) {
        return redactedPathSegment;
    }
    return decoded;
}
function collectorHeaders(writeKey) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeKey}`,
    };
}
function assertAccepted(response) {
    if (response.ok) {
        return;
    }
    if (retryableCollectorStatuses.has(response.status)) {
        throw new RetryableCollectorStatusError(response.status);
    }
    throw new CollectorStatusError(response.status);
}
class CollectorStatusError extends Error {
    constructor(status) {
        super(`custd: collector request failed with status ${status}`);
        this.status = status;
    }
}
class RetryableCollectorStatusError extends RetryableError {
    constructor(status) {
        super(`custd: retryable collector status ${status}`);
        this.status = status;
    }
}
/** A 2xx answer whose body does not match the collector batch contract. */
class MalformedCollectorResponseError extends RetryableError {
    constructor() {
        super("custd: collector response did not match the batch contract");
    }
}
function collectorStatus(error) {
    if (error instanceof RetryableCollectorStatusError || error instanceof CollectorStatusError) {
        return error.status;
    }
    return undefined;
}
async function readCollectorBatchResults(response, expectedCount) {
    let body;
    try {
        body = await response.json();
    }
    catch {
        throw new MalformedCollectorResponseError();
    }
    const results = typeof body === "object" && body !== null ? body.results : undefined;
    if (!Array.isArray(results) || results.length !== expectedCount) {
        throw new MalformedCollectorResponseError();
    }
    return results.map((item) => {
        const result = typeof item === "object" && item !== null ? item : {};
        if (typeof result.success !== "boolean" || typeof result.status !== "number") {
            throw new MalformedCollectorResponseError();
        }
        return { success: result.success, status: result.status };
    });
}
function classifyBatchResults(events, results) {
    const outcome = { rejected: [], retryable: [] };
    results.forEach((result, index) => {
        if (result.success) {
            return;
        }
        if (retryableCollectorStatuses.has(result.status)) {
            outcome.retryable.push(events[index]);
            outcome.retryableStatus ?? (outcome.retryableStatus = result.status);
            return;
        }
        outcome.rejected.push(events[index]);
    });
    return outcome;
}
function assertAllowedOrigin(config) {
    const allowedOrigins = config.allowedOrigins ?? [];
    if (allowedOrigins.length === 0) {
        throw new Error("custd: site config must include allowed origins for this site");
    }
    if (!allowedOrigins.includes(window.location.origin)) {
        throw new Error("custd: origin is not allowed for this site");
    }
}
function installQueuedGlobal() {
    const queued = { calls: [], promises: [] };
    window.custd = {
        track: (eventTypeSlug, payload) => enqueueGlobalCall(queued, { type: "track", eventTypeSlug, payload }),
        trackPageView: () => enqueueGlobalCall(queued, { type: "trackPageView" }),
        setConsent: (state) => {
            enqueueGlobalStateCall(queued, { type: "setConsent", state });
        },
    };
    return queued;
}
function enqueueGlobalCall(queued, call) {
    if (queued.calls.length >= maxQueuedGlobalCalls) {
        return Promise.reject(new Error("custd: queued global call limit exceeded"));
    }
    return new Promise((resolve, reject) => {
        queued.calls.push(call);
        queued.promises.push({ resolve, reject });
    });
}
function enqueueGlobalStateCall(queued, call) {
    if (queued.calls.length >= maxQueuedGlobalCalls) {
        return;
    }
    queued.calls.push(call);
}
async function drainQueuedGlobal(tracker, queued) {
    for (const call of queued.calls) {
        const deferred = call.type === "setConsent" ? undefined : queued.promises.shift();
        try {
            if (call.type === "track") {
                await tracker.track(call.eventTypeSlug, call.payload);
            }
            else if (call.type === "trackPageView") {
                await tracker.trackPageView();
            }
            else {
                tracker.setConsent(call.state);
            }
            deferred?.resolve();
        }
        catch (error) {
            deferred?.reject(error);
        }
    }
}
function rejectQueuedGlobal(queued, error) {
    for (const deferred of queued.promises.splice(0, queued.promises.length)) {
        deferred.reject(error);
    }
}
function installRejectingGlobal(error) {
    window.custd = {
        track: () => Promise.reject(error),
        trackPageView: () => Promise.reject(error),
        setConsent: () => {
            throw error;
        },
    };
}
function storedUUID(key, storage) {
    const existing = storage.getItem(key);
    if (existing) {
        return existing;
    }
    const value = randomUUID();
    storage.setItem(key, value);
    return value;
}
function browserQueueStorage(siteUuid, persistent) {
    if (!persistent || typeof localStorage === "undefined") {
        return new MemoryQueueStorage();
    }
    return new LocalStorageQueueStorage(`custd:${siteUuid}:event_queue`);
}
function currentScript() {
    const script = document.currentScript;
    if (!script) {
        throw new Error("custd: browser script could not find document.currentScript");
    }
    return script;
}
function scriptConsent(script, siteConfig) {
    if (script.dataset.consent === "granted") {
        return "granted";
    }
    return siteConfig.identityMode === "extended" ? "required" : undefined;
}
function defaultScriptBatchSize(siteConfig) {
    return siteConfig.identityMode === "extended" ? 25 : 1;
}
function doNotTrackEnabled() {
    const value = navigator.doNotTrack;
    return value === "1" || value === "yes";
}
function isOnline() {
    return typeof navigator.onLine !== "boolean" || navigator.onLine;
}
function deviceType() {
    return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function assertSecureOrLocalHTTP(rawUrl, field) {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:") {
        return;
    }
    if (parsed.protocol === "http:" && isLocalHostname(parsed.hostname)) {
        return;
    }
    throw new Error(`custd: ${field} must use https unless it targets localhost`);
}
function isLocalHostname(hostname) {
    return (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "host.docker.internal");
}
function randomUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16));
}
