import {
  LocalStorageQueueStorage,
  MemoryQueueStorage,
  RetryableError,
  normalizeRetryOptions,
  prepareEvent,
  validateBrowserEvent,
  withRetry,
  type EventEnvelope,
  type QueueStorage,
  type RetryOptions,
} from "./index.js";

export type BrowserIdentityMode = "cookieless" | "extended";
export type BrowserConsentState = "granted" | "denied";

export type BrowserTrackerConfig = {
  baseUrl: string;
  siteUuid: string;
  writeKey: string;
  allowedOrigins?: string[];
  identityMode?: BrowserIdentityMode;
  consent?: "granted" | "required";
  batchSize?: number;
  maxQueueSize?: number;
  persistentQueue?: boolean;
  queueStorage?: QueueStorage;
  retry?: RetryOptions;
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
  private originalPushState: History["pushState"] | null = null;
  private originalReplaceState: History["replaceState"] | null = null;
  private readonly onlineHandler = () => void this.flush();
  private readonly pagehideHandler = () => this.flushWithKeepalive();

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
    return this.track("page-view", {});
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
    try {
      await this.sendBatch(events);
    } catch (error) {
      this.queue.unshift(...events);
      this.trimQueue();
      this.queueStorage.save(this.queue);
      throw error;
    }
    this.queueStorage.save(this.queue);
  }

  close(): void {
    window.removeEventListener("online", this.onlineHandler);
    window.removeEventListener("pagehide", this.pagehideHandler);
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
      const result = original.apply(window.history, args);
      void this.trackPageView();
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
      context: browserContext(),
      payload: {
        siteUuid: this.config.siteUuid,
        ...payload,
      },
    };
    const mode = this.config.identityMode === "extended" ? "producer" : "browser-cookieless";
    const prepared = prepareEvent(event, { mode });
    validateBrowserEvent(prepared);
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

  private async sendBatch(events: EventEnvelope[], keepalive = false): Promise<void> {
    await withRetry(this.retry, async () => {
      const response = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
        method: "POST",
        headers: collectorHeaders(this.config.writeKey),
        body: JSON.stringify({ events }),
        credentials: "omit",
        keepalive,
      });
      assertAccepted(response);
    });
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
      () => {
        this.queueStorage.save(this.queue);
      },
      () => {
        this.queue.unshift(...events);
        this.trimQueue();
        this.queueStorage.save(this.queue);
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

export async function installBrowserTrackerFromScript(): Promise<BrowserTracker> {
  const script = currentScript();
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
  return await response.json() as BrowserSiteConfig;
}

function browserContext(): EventEnvelope["context"] {
  return {
    page: {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
    },
    device: { type: deviceType() },
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function collectorHeaders(writeKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${writeKey}`,
  };
}

function assertAccepted(response: Response): void {
  if (!response.ok) {
    if ([408, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new RetryableError(`custd: retryable collector status ${response.status}`);
    }
    throw new Error(`custd: collector request failed with status ${response.status}`);
  }
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
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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
