import {
  applyEnvironmentLabel,
  type EventEnvelope,
  LocalStorageQueueStorage,
  MemoryQueueStorage,
  normalizeRetryOptions,
  prepareEvent,
  type QueueStorage,
  RetryableError,
  type RetryOptions,
  validateBrowserEvent,
  withRetry,
} from "./index.js";

export type BrowserIdentityMode = "cookieless" | "extended";
export type BrowserConsentState = "granted" | "denied";

/** The page context the tracker derives before any provider runs. */
export type BrowserPageContextDefaults = {
  /** `location.pathname` after the built-in sanitizer redacts identifiers. */
  path: string;
  /** `document.title` as the page set it. */
  title: string;
};

/**
 * The page context sent with an event. An absent field is not sent, so a
 * provider can omit the title instead of forwarding page content.
 */
export type BrowserPageContext = {
  path?: string;
  title?: string;
};

/**
 * A sanitized description of a failure the tracker handled on its own. It never
 * carries error messages, request bodies, or collector response payloads.
 */
export type BrowserTrackerFailure = {
  /** The automatic call that failed. */
  source: "page-view" | "flush";
  /** Collector HTTP status, when the collector answered. */
  status?: number;
  /** Events the collector permanently rejected, which the tracker dropped. */
  rejectedEvents?: number;
};

export type BrowserTrackerConfig = {
  baseUrl: string;
  siteUuid: string;
  writeKey: string;
  /**
   * The environment this build runs in, for a preview deployment, a staging
   * host, or a local server that shares the same Site. It is sent as the
   * reserved `custd.environment` label; a Site serves every environment unless
   * an operator restricts it, so this is not a second credential.
   */
  environment?: string;
  allowedOrigins?: string[];
  identityMode?: BrowserIdentityMode;
  consent?: "granted" | "required";
  batchSize?: number;
  maxQueueSize?: number;
  persistentQueue?: boolean;
  queueStorage?: QueueStorage;
  retry?: RetryOptions;
  trackInitialPageView?: boolean;
  /**
   * Replaces the page context derived from `location.pathname` and
   * `document.title`. Return a normalized route template such as
   * `/companies/:companySlug/dashboard`, omit `title` so page content is never
   * sent, or return an empty object to send no page context. A path that is not
   * a safe route path, such as a full URL or a path carrying a query, is
   * replaced with the built-in sanitized path; a provider that throws sends no
   * page context rather than falling back to page content.
   */
  pageContext?: (defaults: BrowserPageContextDefaults) => BrowserPageContext;
  /**
   * Observes automatic tracking failures, which the tracker isolates instead of
   * raising as unhandled rejections. Manual calls still reject.
   */
  onFailure?: (failure: BrowserTrackerFailure) => void;
};

export type BrowserTracker = {
  track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
  trackPageView: () => Promise<void>;
  installSpaTracking: () => void;
  setConsent: (state: BrowserConsentState) => void;
  flush: () => Promise<void>;
  close: () => void;
};

export type BrowserSiteConfig = {
  identityMode?: BrowserIdentityMode;
  allowedOrigins?: string[];
};

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

export function createBrowserTracker(config: BrowserTrackerConfig): BrowserTracker {
  return new DefaultBrowserTracker(config);
}

class DefaultBrowserTracker implements BrowserTracker {
  private readonly baseUrl: string;
  private readonly config: BrowserTrackerConfig;
  private readonly queueStorage: QueueStorage;
  private readonly retry: Required<RetryOptions>;
  private readonly maxQueueSize: number;
  private queue: EventEnvelope[] = [];
  private consent: BrowserConsentState;
  private installedSpaTracking = false;
  private lastTrackedPath: string | null = null;
  private originalPushState: History["pushState"] | null = null;
  private originalReplaceState: History["replaceState"] | null = null;
  private readonly onlineHandler = () => this.detach("flush", () => this.flush());
  private readonly pagehideHandler = () => this.flushWithKeepalive();
  private readonly popstateHandler = () => this.detachPathChange(() => this.trackPageView());

  constructor(config: BrowserTrackerConfig) {
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

  async track(eventTypeSlug: string, payload: Record<string, unknown> = {}): Promise<void> {
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

  trackPageView(): Promise<void> {
    this.lastTrackedPath = window.location.pathname;
    return this.track("page-view", poweredByAttribution());
  }

  installSpaTracking(): void {
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

  setConsent(state: BrowserConsentState): void {
    this.consent = state;
    if (state === "denied") {
      this.clearStoredState();
    }
  }

  async flush(): Promise<void> {
    if (this.trackingDisabled()) {
      this.clearStoredState();
      return;
    }
    if (this.queue.length === 0 || !isOnline()) {
      return;
    }
    const events = this.queue.splice(0, this.queue.length);
    let outcome: CollectorBatchOutcome;
    try {
      outcome = await this.sendBatch(events);
    } catch (error) {
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

  close(): void {
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

  private wrapHistoryMethod(original: History["pushState"]): History["pushState"] {
    return ((...args: Parameters<History["pushState"]>) => {
      const previousPath = window.location.pathname;
      const result = original.apply(window.history, args);
      if (window.location.pathname !== previousPath) {
        this.detach("page-view", () => this.trackPageView());
      }
      return result;
    }) as History["pushState"];
  }

  private trackingDisabled(): boolean {
    if (this.consent !== "granted") {
      return true;
    }
    if (doNotTrackEnabled()) {
      return true;
    }
    return false;
  }

  private enqueue(event: EventEnvelope): void {
    this.queue.push(event);
    this.trimQueue();
    this.queueStorage.save(this.queue);
  }

  private trimQueue(): void {
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(this.queue.length - this.maxQueueSize);
    }
  }

  private clearStoredState(): void {
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

  private buildEvent(eventTypeSlug: string, payload: Record<string, unknown>): EventEnvelope {
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

  private identityFields(): Pick<EventEnvelope, "anonymousId" | "sessionId"> {
    if (this.config.identityMode !== "extended") {
      return { anonymousId: "", sessionId: "" };
    }
    return {
      anonymousId: storedUUID(anonymousIDStorageKey(this.config.siteUuid), localStorage),
      sessionId: storedUUID(sessionIDStorageKey(this.config.siteUuid), sessionStorage),
    };
  }

  private async sendEvent(event: EventEnvelope): Promise<void> {
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

  private async sendBatch(events: EventEnvelope[], keepalive = false): Promise<CollectorBatchOutcome> {
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
  private applyBatchOutcome(source: BrowserTrackerFailure["source"], outcome: CollectorBatchOutcome): void {
    if (outcome.retryable.length > 0) {
      this.queue.unshift(...outcome.retryable);
      this.trimQueue();
    }
    this.queueStorage.save(this.queue);
    if (outcome.rejected.length > 0) {
      this.notifyFailure({ source, rejectedEvents: outcome.rejected.length });
    }
  }

  private pageContext(): BrowserPageContext {
    const defaults: BrowserPageContextDefaults = {
      path: sanitizeBrowserPath(window.location.pathname),
      title: document.title,
    };
    const provider = this.config.pageContext;
    if (!provider) {
      return defaults;
    }
    let provided: BrowserPageContext;
    try {
      provided = provider(defaults);
    } catch {
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
  private detach(source: BrowserTrackerFailure["source"], operation: () => Promise<void>): void {
    void operation().catch((error: unknown) => this.notifyFailure({ source, status: collectorStatus(error) }));
  }

  /** Track a popstate only when it lands on a different route path. */
  private detachPathChange(operation: () => Promise<void>): void {
    if (window.location.pathname === this.lastTrackedPath) {
      return;
    }
    this.detach("page-view", operation);
  }

  private notifyFailure(failure: BrowserTrackerFailure): void {
    const onFailure = this.config.onFailure;
    if (!onFailure) {
      return;
    }
    try {
      // An async callback is valid for a void signature. Absorb its rejection
      // without awaiting, so queue settlement never depends on the observer.
      void Promise.resolve(onFailure(failure)).catch(() => undefined);
    } catch {
      // A consumer callback must never break tracking or mask the original failure.
    }
  }

  private flushWithKeepalive(): void {
    if (this.trackingDisabled()) {
      this.clearStoredState();
      return;
    }
    if (this.queue.length === 0) {
      return;
    }
    const events = this.queue.splice(0, this.queue.length);
    void this.sendBatch(events, true).then(
      (outcome) => {
        this.applyBatchOutcome("flush", outcome);
        if (outcome.retryable.length > 0) {
          this.notifyFailure({ source: "flush", status: outcome.retryableStatus ?? 503 });
        }
      },
      (error: unknown) => {
        this.queue.unshift(...events);
        this.trimQueue();
        this.queueStorage.save(this.queue);
        this.notifyFailure({ source: "flush", status: collectorStatus(error) });
      },
    );
  }
}

function anonymousIDStorageKey(siteUuid: string): string {
  return `custd:${siteUuid}:anonymous_id`;
}

function sessionIDStorageKey(siteUuid: string): string {
  return `custd:${siteUuid}:session_id`;
}

function queueStorageKey(siteUuid: string): string {
  return `custd:${siteUuid}:event_queue`;
}

export async function installBrowserTrackerFromScript(scriptElement?: HTMLScriptElement): Promise<BrowserTracker> {
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
      track: (eventTypeSlug: string, payload?: Record<string, unknown>) => tracker.track(eventTypeSlug, payload),
      trackPageView: () => tracker.trackPageView(),
      setConsent: (state: BrowserConsentState) => tracker.setConsent(state),
    };
    await drainQueuedGlobal(tracker, queuedGlobal);
    return tracker;
  } catch (error) {
    rejectQueuedGlobal(queuedGlobal, error);
    installRejectingGlobal(error);
    throw error;
  }
}

async function fetchSiteConfig(baseUrl: string, siteUuid: string): Promise<BrowserSiteConfig> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(siteUuid)}/config`, {
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`custd: site config request failed with status ${response.status}`);
  }
  return (await response.json()) as BrowserSiteConfig;
}

function browserContext(page: BrowserPageContext): EventEnvelope["context"] {
  const context: EventEnvelope["context"] = {
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
function safePageContext(provided: BrowserPageContext, fallbackPath: string): BrowserPageContext {
  const page: BrowserPageContext = {};
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
function isSafeRoutePath(path: string): boolean {
  if (path.length === 0 || path.length > maxRoutePathLength || !path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  return path.split("/").every((segment) => safeRoutePathSegment.test(segment));
}

function sanitizePageTitle(title: unknown): string | undefined {
  if (typeof title !== "string") {
    return undefined;
  }
  const cleaned = title.replace(/[\p{Cc}]/gu, "").trim();
  return cleaned === "" ? undefined : cleaned.slice(0, maxPageTitleLength);
}

function poweredByAttribution(): Record<string, string> {
  const query = new URL(window.location.href).searchParams;
  const project = query.get("ref") ?? "";
  if (query.get("source") !== "powered-by" || !poweredByProjectSlug.test(project)) {
    return {};
  }
  return { utmSource: project, utmMedium: "powered-by" };
}

function sanitizeBrowserPath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = path.split("/").map(sanitizePathSegment);
  return segments.join("/") || "/";
}

function sanitizePathSegment(segment: string): string {
  if (segment === "") {
    return "";
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return redactedPathSegment;
  }

  if (
    !safePathSegment.test(decoded) ||
    uuidPathSegment.test(decoded) ||
    /^\d+$/u.test(decoded) ||
    opaquePathSegment.test(decoded)
  ) {
    return redactedPathSegment;
  }
  return decoded;
}

function collectorHeaders(writeKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${writeKey}`,
  };
}

function assertAccepted(response: Response): void {
  if (response.ok) {
    return;
  }
  if (retryableCollectorStatuses.has(response.status)) {
    throw new RetryableCollectorStatusError(response.status);
  }
  throw new CollectorStatusError(response.status);
}

class CollectorStatusError extends Error {
  constructor(readonly status: number) {
    super(`custd: collector request failed with status ${status}`);
  }
}

class RetryableCollectorStatusError extends RetryableError {
  constructor(readonly status: number) {
    super(`custd: retryable collector status ${status}`);
  }
}

/** A 2xx answer whose body does not match the collector batch contract. */
class MalformedCollectorResponseError extends RetryableError {
  constructor() {
    super("custd: collector response did not match the batch contract");
  }
}

function collectorStatus(error: unknown): number | undefined {
  if (error instanceof RetryableCollectorStatusError || error instanceof CollectorStatusError) {
    return error.status;
  }
  return undefined;
}

/** The per-item answer of `POST /api/v1/collect/events/batch`. */
type CollectorBatchResult = {
  success: boolean;
  status: number;
};

type CollectorBatchOutcome = {
  /** Events the collector permanently rejected; retrying them cannot succeed. */
  rejected: EventEnvelope[];
  /** Events that failed with a retryable status; the queue keeps them. */
  retryable: EventEnvelope[];
  retryableStatus?: number;
};

async function readCollectorBatchResults(response: Response, expectedCount: number): Promise<CollectorBatchResult[]> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MalformedCollectorResponseError();
  }
  const results = typeof body === "object" && body !== null ? (body as { results?: unknown }).results : undefined;
  if (!Array.isArray(results) || results.length !== expectedCount) {
    throw new MalformedCollectorResponseError();
  }
  return results.map((item: unknown) => {
    const result = typeof item === "object" && item !== null ? (item as { success?: unknown; status?: unknown }) : {};
    if (typeof result.success !== "boolean" || typeof result.status !== "number") {
      throw new MalformedCollectorResponseError();
    }
    return { success: result.success, status: result.status };
  });
}

function classifyBatchResults(events: EventEnvelope[], results: CollectorBatchResult[]): CollectorBatchOutcome {
  const outcome: CollectorBatchOutcome = { rejected: [], retryable: [] };
  results.forEach((result, index) => {
    if (result.success) {
      return;
    }
    if (retryableCollectorStatuses.has(result.status)) {
      outcome.retryable.push(events[index]);
      outcome.retryableStatus ??= result.status;
      return;
    }
    outcome.rejected.push(events[index]);
  });
  return outcome;
}

function assertAllowedOrigin(config: BrowserTrackerConfig): void {
  const allowedOrigins = config.allowedOrigins ?? [];
  if (allowedOrigins.length === 0) {
    throw new Error("custd: site config must include allowed origins for this site");
  }
  if (!allowedOrigins.includes(window.location.origin)) {
    throw new Error("custd: origin is not allowed for this site");
  }
}

type QueuedGlobalCall =
  | { type: "track"; eventTypeSlug: string; payload?: Record<string, unknown> }
  | { type: "trackPageView" }
  | { type: "setConsent"; state: BrowserConsentState };

type QueuedGlobal = {
  calls: QueuedGlobalCall[];
  promises: Array<{ resolve: () => void; reject: (error: unknown) => void }>;
};

function installQueuedGlobal(): QueuedGlobal {
  const queued: QueuedGlobal = { calls: [], promises: [] };
  window.custd = {
    track: (eventTypeSlug: string, payload?: Record<string, unknown>) =>
      enqueueGlobalCall(queued, { type: "track", eventTypeSlug, payload }),
    trackPageView: () => enqueueGlobalCall(queued, { type: "trackPageView" }),
    setConsent: (state: BrowserConsentState) => {
      enqueueGlobalStateCall(queued, { type: "setConsent", state });
    },
  };
  return queued;
}

function enqueueGlobalCall(queued: QueuedGlobal, call: QueuedGlobalCall): Promise<void> {
  if (queued.calls.length >= maxQueuedGlobalCalls) {
    return Promise.reject(new Error("custd: queued global call limit exceeded"));
  }
  return new Promise((resolve, reject) => {
    queued.calls.push(call);
    queued.promises.push({ resolve, reject });
  });
}

function enqueueGlobalStateCall(queued: QueuedGlobal, call: QueuedGlobalCall): void {
  if (queued.calls.length >= maxQueuedGlobalCalls) {
    return;
  }
  queued.calls.push(call);
}

async function drainQueuedGlobal(tracker: BrowserTracker, queued: QueuedGlobal): Promise<void> {
  for (const call of queued.calls) {
    const deferred = call.type === "setConsent" ? undefined : queued.promises.shift();
    try {
      if (call.type === "track") {
        await tracker.track(call.eventTypeSlug, call.payload);
      } else if (call.type === "trackPageView") {
        await tracker.trackPageView();
      } else {
        tracker.setConsent(call.state);
      }
      deferred?.resolve();
    } catch (error) {
      deferred?.reject(error);
    }
  }
}

function rejectQueuedGlobal(queued: QueuedGlobal, error: unknown): void {
  for (const deferred of queued.promises.splice(0, queued.promises.length)) {
    deferred.reject(error);
  }
}

function installRejectingGlobal(error: unknown): void {
  window.custd = {
    track: () => Promise.reject(error),
    trackPageView: () => Promise.reject(error),
    setConsent: () => {
      throw error;
    },
  };
}

function storedUUID(key: string, storage: Storage): string {
  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }
  const value = randomUUID();
  storage.setItem(key, value);
  return value;
}

function browserQueueStorage(siteUuid: string, persistent: boolean): QueueStorage {
  if (!persistent || typeof localStorage === "undefined") {
    return new MemoryQueueStorage();
  }
  return new LocalStorageQueueStorage(`custd:${siteUuid}:event_queue`);
}

function currentScript(): HTMLScriptElement {
  const script = document.currentScript;
  if (!script) {
    throw new Error("custd: browser script could not find document.currentScript");
  }
  return script as HTMLScriptElement;
}

function scriptConsent(script: HTMLScriptElement, siteConfig: BrowserSiteConfig): BrowserTrackerConfig["consent"] {
  if (script.dataset.consent === "granted") {
    return "granted";
  }
  return siteConfig.identityMode === "extended" ? "required" : undefined;
}

function defaultScriptBatchSize(siteConfig: BrowserSiteConfig): number {
  return siteConfig.identityMode === "extended" ? 25 : 1;
}

function doNotTrackEnabled(): boolean {
  const value = navigator.doNotTrack;
  return value === "1" || value === "yes";
}

function isOnline(): boolean {
  return typeof navigator.onLine !== "boolean" || navigator.onLine;
}

function deviceType(): string {
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

function assertSecureOrLocalHTTP(rawUrl: string, field: string): void {
  const parsed = new URL(rawUrl);
  if (parsed.protocol === "https:") {
    return;
  }
  if (parsed.protocol === "http:" && isLocalHostname(parsed.hostname)) {
    return;
  }
  throw new Error(`custd: ${field} must use https unless it targets localhost`);
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "host.docker.internal"
  );
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

declare global {
  interface Window {
    custd: {
      track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
      trackPageView: () => Promise<void>;
      setConsent: (state: BrowserConsentState) => void;
    };
  }
}
