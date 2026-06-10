export type EventContext = {
  page?: {
    url?: string;
    path?: string;
    title?: string;
    referrer?: string;
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
  };
  locale?: string;
  timezone?: string;
  ip?: string;
  [key: string]: unknown;
};

export type EventEnvelope = {
  eventUuid?: string;
  eventTypeSlug: string;
  schemaVersion: string;
  timestamp: string;
  sessionId?: string;
  anonymousId?: string;
  userUuid?: string | null;
  companySlug?: string;
  context: EventContext;
  payload: Record<string, unknown>;
};

export type DogfoodEventInput = {
  eventTypeSlug: string;
  schemaVersion: string;
  companySlug: string;
  sourceSystem: string;
  sourceCompany: string;
  environment: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

type EventBatchResponse = {
  success?: boolean;
};

export type ProducerOAuthConfig = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  audience?: string;
  scopes?: string[];
};

export type ClientConfig = {
  baseUrl: string;
  getToken?: () => string | Promise<string>;
  oauth?: ProducerOAuthConfig;
  defaultHeaders?: Record<string, string>;
  retry?: RetryOptions;
  batch?: BatchOptions;
  queue?: QueueOptions;
};

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  retryOnStatuses?: number[];
};

export type BatchOptions = {
  maxBatchSize?: number;
  flushIntervalMs?: number;
};

export type QueueOptions = {
  enabled?: boolean;
  storage?: QueueStorage;
  maxQueueSize?: number;
  flushOnOnline?: boolean;
};

export type QueueStorage = {
  load: () => EventEnvelope[];
  save: (events: EventEnvelope[]) => void;
  clear: () => void;
};

export type AdminTenantCreate = {
  slug: string;
  companyName: string;
};

export type AdminTenant = {
  slug: string;
  companyName: string;
  enabled: boolean;
};

export type AdminTenantListResponse = {
  tenants: AdminTenant[];
};

export type AdminOAuthClientCreate = {
  clientId: string;
  companySlug: string;
  scopes: string[];
};

export type AdminOAuthClient = {
  clientId: string;
  companySlug: string;
  scopes: string[];
};

export type AdminOAuthClientCreateResponse = AdminOAuthClient & {
  clientSecret: string;
};

export type AdminOAuthClientListResponse = {
  clients: AdminOAuthClient[];
};

export type AdminOAuthClientSecretResponse = {
  clientSecret: string;
};

export type AdminSiteCreate = {
  companySlug: string;
  name: string;
  identityMode: "cookieless" | "extended";
  allowedOrigins: string[];
  rateLimitPerMinute?: number;
  retentionDays?: number;
};

export type AdminSite = {
  siteUuid: string;
  companySlug: string;
  name: string;
  identityMode: "cookieless" | "extended";
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  retentionDays: number;
  enabled: boolean;
};

export type AdminSiteCreateResponse = AdminSite & {
  writeKey: string;
};

export type AdminSiteListResponse = {
  sites: AdminSite[];
};

export type AdminSiteWriteKeyResponse = {
  writeKey: string;
};

function publicAdminSite(site: AdminSite & { writeKey?: unknown }): AdminSite {
  const { writeKey: _writeKey, ...safeSite } = site;
  return safeSite;
}

export class MemoryQueueStorage implements QueueStorage {
  private events: EventEnvelope[] = [];

  load(): EventEnvelope[] {
    return [...this.events];
  }

  save(events: EventEnvelope[]): void {
    this.events = [...events];
  }

  clear(): void {
    this.events = [];
  }
}

export class LocalStorageQueueStorage implements QueueStorage {
  private key: string;

  constructor(key = "custd_event_queue") {
    this.key = key;
  }

  load(): EventEnvelope[] {
    if (typeof localStorage === "undefined") {
      return [];
    }
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as EventEnvelope[];
      }
    } catch {
      return [];
    }
    return [];
  }

  save(events: EventEnvelope[]): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(this.key, JSON.stringify(events));
  }

  clear(): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.removeItem(this.key);
  }
}

export class CustdClient {
  public readonly admin: AdminNamespace;
  private baseUrl: string;
  private getToken: () => string | Promise<string>;
  private defaultHeaders: Record<string, string>;
  private retry: Required<RetryOptions>;
  private batch: BatchOptions | undefined;
  private queueEnabled: boolean;
  private queueStorage: QueueStorage;
  private queue: EventEnvelope[] = [];
  private maxQueueSize: number;
  private flushOnOnline: boolean;
  private onlineHandler: (() => void) | null = null;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private oauthToken: { value: string; expiresAtMs: number } | null = null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    assertSecureOrLocalHTTP(this.baseUrl, "baseUrl");
    if (config.oauth) {
      assertSecureOrLocalHTTP(config.oauth.tokenUrl, "tokenUrl");
      this.getToken = () => this.fetchOAuthToken(config.oauth as ProducerOAuthConfig);
    } else if (config.getToken) {
      this.getToken = config.getToken;
    } else {
      throw new Error("custd: getToken or oauth config is required");
    }
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.retry = normalizeRetryOptions(config.retry);
    this.batch = config.batch;
    this.queueEnabled = config.queue?.enabled ?? config.batch != null;
    this.queueStorage = config.queue?.storage ?? new MemoryQueueStorage();
    this.maxQueueSize = config.queue?.maxQueueSize ?? 1000;
    this.flushOnOnline = config.queue?.flushOnOnline ?? true;
    this.admin = new AdminNamespace((method, path, body) => this.adminRequest(method, path, body));

    if (this.queueEnabled) {
      this.queue = this.queueStorage.load();
    }

    if (this.batch?.flushIntervalMs && this.batch.flushIntervalMs > 0) {
      this.batchTimer = setInterval(() => {
        void this.flush();
      }, this.batch.flushIntervalMs);
    }

    if (this.flushOnOnline && typeof window !== "undefined" && typeof window.addEventListener === "function") {
      this.onlineHandler = () => void this.flush();
      window.addEventListener("online", this.onlineHandler);
    }
  }

  private async fetchOAuthToken(config: ProducerOAuthConfig): Promise<string> {
    const now = Date.now();
    if (this.oauthToken && this.oauthToken.expiresAtMs > now + 30_000) {
      return this.oauthToken.value;
    }

    const body = new URLSearchParams();
    body.set("grant_type", "client_credentials");
    body.set("client_id", config.clientId);
    body.set("client_secret", config.clientSecret);
    if (config.audience) {
      body.set("audience", config.audience);
    }
    if (config.scopes && config.scopes.length > 0) {
      body.set("scope", config.scopes.join(" "));
    }

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) {
      throw new Error(`custd: token request failed with status ${response.status}`);
    }
    const token = await response.json() as { access_token?: string; expires_in?: number };
    if (!token.access_token) {
      throw new Error("custd: token response missing access_token");
    }
    this.oauthToken = {
      value: token.access_token,
      expiresAtMs: now + Math.max(0, token.expires_in ?? 300) * 1000,
    };
    return token.access_token;
  }

  async ingestEvent(event: EventEnvelope): Promise<Response> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    return this.sendWithRetry(prepared);
  }

  async track(event: EventEnvelope): Promise<void | Response> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    if (!this.queueEnabled) {
      return this.sendWithRetry(prepared);
    }

    this.enqueue(prepared);
    if (this.batch) {
      const maxBatchSize = this.batch.maxBatchSize ?? 0;
      if (maxBatchSize > 0 && this.queue.length >= maxBatchSize) {
        await this.flush();
      }
    } else if (isOnline()) {
      await this.flush();
    }
    return undefined;
  }

  enqueue(event: EventEnvelope): void {
    if (!this.queueEnabled) {
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push(event);
    this.queueStorage.save(this.queue);
  }

  async flush(): Promise<void> {
    if (!this.queueEnabled || this.queue.length === 0) {
      return;
    }

    if (!isOnline()) {
      return;
    }

    const maxBatchSize = this.batch?.maxBatchSize ?? this.queue.length;
    const toSend = this.queue.splice(0, maxBatchSize);

    try {
      await this.sendBatchWithRetry(toSend);
    } catch (err) {
      this.queue = [...toSend, ...this.queue];
      this.queueStorage.save(this.queue);
      throw err;
    }

    this.queueStorage.save(this.queue);
  }

  close(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.onlineHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  private async sendWithRetry(event: EventEnvelope): Promise<Response> {
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const response = await fetch(`${this.baseUrl}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...this.defaultHeaders,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const retryable = this.retry.retryOnStatuses.includes(response.status);
        if (retryable) {
          throw new RetryableError(`custd: retryable status ${response.status}`);
        }
        throw new Error(`custd: request failed with status ${response.status}`);
      }

      return response;
    });
  }

  private async sendBatchWithRetry(events: EventEnvelope[]): Promise<Response> {
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const response = await fetch(`${this.baseUrl}/api/v1/events/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...this.defaultHeaders,
        },
        body: JSON.stringify({ events }),
      });

      await this.assertBatchResponse(response);
      return response;
    });
  }

  private async assertBatchResponse(response: Response): Promise<void> {
    if (!response.ok) {
      const retryable = this.retry.retryOnStatuses.includes(response.status);
      if (retryable) {
        throw new RetryableError(`custd: retryable status ${response.status}`);
      }
      throw new Error(`custd: request failed with status ${response.status}`);
    }

    const text = await response.text();
    if (text === "") {
      return;
    }
    const body = JSON.parse(text) as EventBatchResponse;
    if (body.success === false) {
      throw new Error(`custd: batch request failed with status ${response.status}`);
    }
  }

  private async adminRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}/api/v1/admin${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...this.defaultHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`custd: admin request failed with status ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return await response.json() as T;
  }
}

type AdminRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;

class AdminNamespace {
  readonly tenants: AdminTenantNamespace;
  readonly oauthClients: AdminOAuthClientNamespace;
  readonly sites: AdminSiteNamespace;

  constructor(request: AdminRequester) {
    this.tenants = new AdminTenantNamespace(request);
    this.oauthClients = new AdminOAuthClientNamespace(request);
    this.sites = new AdminSiteNamespace(request);
  }
}

class AdminTenantNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(tenant: AdminTenantCreate): Promise<AdminTenant> {
    return this.request("POST", "/tenants", tenant);
  }

  list(): Promise<AdminTenantListResponse> {
    return this.request("GET", "/tenants");
  }

  get(slug: string): Promise<AdminTenant> {
    return this.request("GET", `/tenants/${encodeURIComponent(slug)}`);
  }

  delete(slug: string): Promise<void> {
    return this.request("DELETE", `/tenants/${encodeURIComponent(slug)}`);
  }
}

class AdminOAuthClientNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(client: AdminOAuthClientCreate): Promise<AdminOAuthClientCreateResponse> {
    return this.request("POST", "/oauth-clients", client);
  }

  list(): Promise<AdminOAuthClientListResponse> {
    return this.request("GET", "/oauth-clients");
  }

  get(clientId: string): Promise<AdminOAuthClient> {
    return this.request("GET", `/oauth-clients/${encodeURIComponent(clientId)}`);
  }

  delete(clientId: string): Promise<void> {
    return this.request("DELETE", `/oauth-clients/${encodeURIComponent(clientId)}`);
  }

  rotateSecret(clientId: string): Promise<AdminOAuthClientSecretResponse> {
    return this.request("POST", `/oauth-clients/${encodeURIComponent(clientId)}/rotate-secret`);
  }
}

class AdminSiteNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(site: AdminSiteCreate): Promise<AdminSiteCreateResponse> {
    return this.request("POST", "/sites", site);
  }

  async list(): Promise<AdminSiteListResponse> {
    const response = await this.request<AdminSiteListResponse & { sites: Array<AdminSite & { writeKey?: unknown }> }>(
      "GET",
      "/sites",
    );
    return { sites: response.sites.map(publicAdminSite) };
  }

  async get(siteUuid: string): Promise<AdminSite> {
    const site = await this.request<AdminSite & { writeKey?: unknown }>("GET", `/sites/${encodeURIComponent(siteUuid)}`);
    return publicAdminSite(site);
  }

  delete(siteUuid: string): Promise<void> {
    return this.request("DELETE", `/sites/${encodeURIComponent(siteUuid)}`);
  }

  rotateWriteKey(siteUuid: string): Promise<AdminSiteWriteKeyResponse> {
    return this.request("POST", `/sites/${encodeURIComponent(siteUuid)}/rotate-write-key`);
  }
}

export type PrepareEventMode = "producer" | "browser-cookieless";

export type PrepareEventOptions = {
  mode?: PrepareEventMode;
};

export function validateEvent(event: EventEnvelope): void {
  const missing: string[] = [];

  if (!event.eventUuid) missing.push("eventUuid");
  if (!event.eventTypeSlug) missing.push("eventTypeSlug");
  if (!event.schemaVersion) missing.push("schemaVersion");
  if (!event.timestamp) missing.push("timestamp");
  if (!event.sessionId) missing.push("sessionId");
  if (!event.anonymousId) missing.push("anonymousId");
  if (!event.companySlug) missing.push("companySlug");
  if (!event.context) missing.push("context");
  if (!event.payload) missing.push("payload");

  const deviceType = event.context?.device?.type;
  if (!deviceType) missing.push("context.device.type");

  if (missing.length > 0) {
    throw new Error(`custd: missing required fields: ${missing.join(", ")}`);
  }
}

export function validateBrowserEvent(event: EventEnvelope): void {
  const missing: string[] = [];

  if (!event.eventUuid) missing.push("eventUuid");
  if (!event.eventTypeSlug) missing.push("eventTypeSlug");
  if (!event.schemaVersion) missing.push("schemaVersion");
  if (!event.timestamp) missing.push("timestamp");
  if (!event.context) missing.push("context");
  if (!event.payload) missing.push("payload");
  if (!event.payload?.siteUuid) missing.push("payload.siteUuid");

  const deviceType = event.context?.device?.type;
  if (!deviceType) missing.push("context.device.type");

  if (missing.length > 0) {
    throw new Error(`custd: missing required browser fields: ${missing.join(", ")}`);
  }
}

export function createDogfoodEvent(input: DogfoodEventInput): EventEnvelope {
  const missing: string[] = [];
  if (!input.eventTypeSlug) missing.push("eventTypeSlug");
  if (!input.schemaVersion) missing.push("schemaVersion");
  if (!input.companySlug) missing.push("companySlug");
  if (!input.sourceSystem) missing.push("sourceSystem");
  if (!input.sourceCompany) missing.push("sourceCompany");
  if (!input.environment) missing.push("environment");
  if (missing.length > 0) {
    throw new Error(`custd: missing dogfood fields: ${missing.join(", ")}`);
  }

  const payload = sanitizeDogfoodPayload(input.payload ?? {});
  payload.sourceSystem = input.sourceSystem;
  payload.sourceCompany = input.sourceCompany;
  payload.environment = input.environment;
  payload.schemaVersion = input.schemaVersion;
  if (input.correlationId) {
    payload.correlationId = input.correlationId;
  }

  return prepareEvent({
    eventTypeSlug: input.eventTypeSlug,
    schemaVersion: input.schemaVersion,
    timestamp: new Date().toISOString(),
    companySlug: input.companySlug,
    context: { device: { type: "server" } },
    payload,
  });
}

export function prepareEvent(event: EventEnvelope, options: PrepareEventOptions = {}): EventEnvelope {
  if (options.mode === "browser-cookieless") {
    return {
      ...event,
      eventUuid: event.eventUuid || randomUUID(),
      sessionId: event.sessionId ?? "",
      anonymousId: event.anonymousId ?? "",
    };
  }
  return {
    ...event,
    eventUuid: event.eventUuid || randomUUID(),
    sessionId: event.sessionId || randomUUID(),
    anonymousId: event.anonymousId || randomUUID(),
  };
}

export class RetryableError extends Error {}

const dogfoodProtectedPayloadFields = new Set([
  "sourcesystem",
  "sourcecompany",
  "environment",
  "schemaversion",
  "correlationid",
]);

const dogfoodForbiddenPayloadFields = new Set([
  "apikey",
  "authorization",
  "password",
  "rawapiresponse",
  "token",
  "signedurl",
  "rawprompt",
  "oauthcode",
  "devicesecret",
  "providercredential",
]);

function sanitizeDogfoodPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!dogfoodPayloadFieldAllowed(key)) {
      continue;
    }
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = sanitizeDogfoodPayload(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function dogfoodPayloadFieldAllowed(key: string): boolean {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return !dogfoodProtectedPayloadFields.has(normalized) && !dogfoodForbiddenPayloadFields.has(normalized);
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

export function normalizeRetryOptions(options?: RetryOptions): Required<RetryOptions> {
  return {
    maxAttempts: options?.maxAttempts ?? 3,
    baseDelayMs: options?.baseDelayMs ?? 200,
    maxDelayMs: options?.maxDelayMs ?? 2000,
    jitter: options?.jitter ?? 0.2,
    retryOnStatuses: options?.retryOnStatuses ?? [408, 429, 500, 502, 503, 504],
  };
}

export async function withRetry<T>(options: Required<RetryOptions>, op: () => Promise<T>): Promise<T> {
  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await op();
    } catch (err) {
      const retryable = err instanceof RetryableError || err instanceof TypeError;
      if (!retryable || attempt >= options.maxAttempts) {
        throw err;
      }
      const delay = backoffDelay(options, attempt);
      await sleep(delay);
    }
  }
}

function backoffDelay(options: Required<RetryOptions>, attempt: number): number {
  const exp = options.baseDelayMs * Math.pow(2, attempt-1);
  const capped = Math.min(exp, options.maxDelayMs);
  const jitter = capped * options.jitter * (Math.random() * 2 - 1);
  return Math.max(0, capped + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  if (typeof navigator.onLine !== "boolean") {
    return true;
  }
  return navigator.onLine;
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  );
}
