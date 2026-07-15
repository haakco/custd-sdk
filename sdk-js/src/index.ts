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
  appVersion?: string;
  networkState?: "offline" | "online" | "unknown";
};

export {
  createMobileAsyncQueueStorage,
  createMobileFlushTriggers,
  type MobileAppState,
  type MobileFlushTriggerOptions,
  type MobileKeyValueStorage,
  type MobileNetwork,
  type MobileNetworkState,
  type MobileSubscription,
} from "./mobile-adapter.js";
export {
  createMobileEvent,
  type MobileEventContext,
  type MobileEventInput,
  type MobileNetworkState as MobileEventNetworkState,
  type MobilePlatform,
  type MobileSubject,
} from "./mobile-context.js";
export { AsyncEventQueue, type AsyncQueueStorage } from "./mobile-queue.js";

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
  strictPayloadKeys?: boolean;
  payload?: Record<string, unknown>;
};

// ProblemDetails is an RFC 9457 problem document (application/problem+json).
// The ingest API returns it for error responses and embeds it as the `error`
// field of a failed per-event batch result. detail/code/instance/traceId/fields
// are omitempty server-side and may be absent.
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  instance?: string;
  traceId?: string;
  fields?: Record<string, string>;
};

type EventResult = {
  eventUuid?: string;
  success?: boolean;
  status?: number;
  error?: ProblemDetails;
};

type EventBatchResponse = {
  success?: boolean;
  results?: EventResult[];
};

export type ProducerOAuthConfig = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  audience?: string;
  scopes?: string[];
};

// ProvisionedProducerCredentials is the flat camelCase bundle Custd returns
// from the producer provisioning API. Pass it straight to
// CustdClient.fromProvisionedProducer without manual field mapping.
export type ProvisionedProducerCredentials = {
  companySlug: string;
  baseUrl: string;
  tokenUrl: string;
  audience?: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  environment?: string;
  metadata?: Record<string, string>;
};

// RedactedProvisionedProducerCredentials is the display-safe view of a
// provisioned producer bundle, omitting the client secret.
export type RedactedProvisionedProducerCredentials = Omit<ProvisionedProducerCredentials, "clientSecret">;

export type DataSpaceCreate = {
  slug: string;
  companyName: string;
};

export type DataSpace = {
  slug: string;
  companyName: string;
  parentCompanySlug: string;
  enabled: boolean;
};

export type DataSpaceEntitlementState = {
  enabled: boolean;
  activeDataSpaces: number;
  maxActiveDataSpaces: number;
  maxActiveProducersPerDataSpace: number;
};

export type DataSpaceListResponse = {
  dataSpaces: DataSpace[];
  entitlement: DataSpaceEntitlementState;
};

export type ProducerProvisionCreate = {
  companySlug: string;
  producerSlug: string;
  displayName?: string;
  environment?: string;
  scopes?: string[];
  scopeTemplate?: "events" | "schemas" | "managed-audit" | "managed-audit-reporting-read";
  metadata?: Record<string, string>;
};

export type ProducerProvisionPublicClient = {
  clientId: string;
  companySlug: string;
  producerSlug: string;
  scopes: string[];
  environment?: string;
  metadata?: Record<string, string>;
};

export type ClientConfig = {
  baseUrl: string;
  getToken?: (options?: RequestOptions) => string | Promise<string>;
  oauth?: ProducerOAuthConfig;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
  retry?: RetryOptions;
  batch?: BatchOptions;
  queue?: QueueOptions;
  compression?: CompressionOptions;
};

export type RequestOptions = {
  signal?: AbortSignal;
};

export type BrokerEnv = Record<string, string | undefined>;

export type BrokerEnvClientOptions = Omit<ClientConfig, "baseUrl" | "getToken" | "oauth"> & {
  baseUrl?: string;
  scopes?: string[];
};

export type CompressionOptions = {
  enabled?: boolean;
  thresholdBytes?: number;
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
  flushTriggers?: Array<(flush: () => Promise<void>) => () => void>;
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

export type AdminSchemaRegister = {
  eventTypeSlug: string;
  version: string;
  jsonSchema: Record<string, unknown>;
};

export type AdminSchemaVersionCreate = {
  version: string;
  jsonSchema: Record<string, unknown>;
};

export type AdminSchema = {
  eventTypeSlug: string;
  version: string;
  jsonSchema?: Record<string, unknown>;
};

export type AdminSchemaListResponse = {
  schemas: AdminSchema[];
};

export type MeasurementProjectCreate = {
  projectCode: string;
  name: string;
  kind: string;
  description?: string;
  series: MeasurementSeriesCreate[];
  target: MeasurementTargetCreate;
};

export type MeasurementProject = {
  projectUuid: string;
  projectCode: string;
  name: string;
  kind: string;
  status: string;
  description?: string;
  series?: MeasurementSeries[];
  target?: MeasurementTarget;
};

export type MeasurementSeries = {
  seriesUuid: string;
  seriesCode: string;
  name: string;
  unitSlug: string;
  completionDirection: string;
  source: string;
};

export type MeasurementTarget = {
  targetUuid: string;
  targetCode: string;
  name: string;
  targetValue: number;
  targetDate?: string;
  state: string;
};

export type MeasurementProjectListResponse = {
  projects: MeasurementProject[];
};

export type MeasurementSeriesCreate = {
  seriesCode: string;
  name: string;
  unitSlug: string;
  completionDirection: string;
  source: string;
};

export type MeasurementTargetCreate = {
  targetCode: string;
  name: string;
  targetValue: number;
  targetDate?: string;
  state: string;
};

export type MeasurementObservationInput = {
  seriesUuid: string;
  observedAt: string;
  value: number;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
};

export type MeasurementObservationBulkRequest = {
  rows: MeasurementObservationInput[];
};

export type MeasurementObservationResult = {
  rowIndex: number;
  success: boolean;
  status?: number;
  observationUuid?: string;
  type?: string;
  title?: string;
  detail?: string;
};

export type MeasurementObservationBulkResponse = {
  importId: string;
  accepted: number;
  rejected: number;
  results: MeasurementObservationResult[];
};

export type MeasurementCSVImportResponse = {
  importId: string;
  accepted: number;
  rejected: number;
  results: MeasurementObservationResult[];
};

export type SchemaValidationIssue = {
  path: string;
  keyword: string;
  message: string;
  schemaLocation: string;
  instanceLocation: string;
  severity: string;
};

export type SchemaExampleResult = {
  index: number;
  valid: boolean;
  class: string;
  oldValid: boolean;
  newValid: boolean;
  issueCodes: string[];
  issues: SchemaValidationIssue[];
};

export type SchemaValidationRequest = {
  slug?: string;
  name?: string;
  version?: string;
  jsonSchema: string;
  examples?: Array<Record<string, unknown>>;
};

export type SchemaValidationResponse = {
  valid: boolean;
  schemaValid: boolean;
  issues: SchemaValidationIssue[];
  warnings: SchemaValidationIssue[];
  exampleResults: SchemaExampleResult[];
  normalizedSchema: string;
  dialect: string;
  checksum: string;
  wouldCreateEventType: boolean;
  wouldCreateVersion: boolean;
  conflicts: Array<{ field: string; message: string }>;
  validatorEngine: string;
  validatorVersion: string;
  schemaChecksum: string;
  schemaDialect: string;
};

export type SchemaInferenceRequest = {
  samples: Array<Record<string, unknown>>;
};

export type SchemaInferenceResponse = {
  valid: boolean;
  issues: SchemaValidationIssue[];
  inferenceWarnings: SchemaValidationIssue[];
  candidateSchema: string;
  validatorEngine: string;
  validatorVersion: string;
  schemaChecksum: string;
  schemaDialect: string;
};

export type SendTestEventResponse = {
  success: boolean;
  eventUuid: string;
};

export type ReportingDashboard = {
  key: string;
  title: string;
  hidden?: boolean;
  defaultRange: string;
  refreshSeconds: number;
  requiredScopes: string[];
  widgets: ReportingWidget[];
};

export type ReportingWidget = {
  key: string;
  title: string;
  kind: string;
  template: string;
  metrics: string[];
  dimensions?: string[];
};

export type ReportingQueryRequest = {
  template: string;
  metrics: string[];
  dimensions?: string[];
  filters?: ReportingFilter[];
  from?: string;
  to?: string;
  rangeDays?: number;
  maxRows?: number;
  countOnly?: boolean;
};

export type ReportingFilter = {
  dimension: string;
  operator: string;
  value?: string;
};

export type ReportingWidgetData = {
  buckets: ReportingWidgetBucket[];
  count: number;
  complete: boolean;
  truncated: boolean;
  queryDurationMs: number;
  parquetUriCount?: number;
  snapshotAgeMs?: number;
  eventLagP95Ms?: number;
  deltaCount?: number;
  deltaPercent?: number;
  deltaLabel?: string;
  secondaryLabel?: string;
  trust?: ReportingTrust;
};

export type ReportingWidgetBucket = {
  date: string;
  count: number;
  source: string;
  complete: boolean;
  queryDurationMs?: number;
  parquetUriCount?: number;
  message?: string;
  secondaryCount?: number;
};

export type ReportingTrust = {
  status: string;
  dataFreshness: string;
  lastAwthyExport?: string;
  schemaVersion?: string;
  contractVersion?: string;
  rollupState: string;
  queryWarnings?: string[];
  coverage: string;
  permissionClass?: string;
  dataSufficiency: string;
  captureState: string;
  consentState: string;
  exportState: string;
  partialReason?: string;
  unavailableReason?: string;
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
  public readonly provisioning: ProvisioningNamespace;
  public readonly reporting: ReportingNamespace;
  public readonly schemas: SchemaNamespace;
  private baseUrl: string;
  private getToken: (options?: RequestOptions) => string | Promise<string>;
  private fetchImpl: typeof fetch;
  private defaultHeaders: Record<string, string>;
  private retry: Required<RetryOptions>;
  private batch: BatchOptions | undefined;
  private queueEnabled: boolean;
  private queueStorage: QueueStorage;
  private queue: EventEnvelope[] = [];
  private maxQueueSize: number;
  private flushOnOnline: boolean;
  private onlineHandler: (() => void) | null = null;
  private compressionEnabled: boolean;
  private compressionThresholdBytes: number;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private removeFlushTriggers: Array<() => void> = [];
  private oauthToken: { value: string; expiresAtMs: number } | null = null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    const fetchImpl = config.fetch ?? globalThis.fetch;
    this.fetchImpl = (input, init) => fetchImpl(input, init);
    assertSecureOrLocalHTTP(this.baseUrl, "baseUrl");
    if (config.oauth) {
      assertSecureOrLocalHTTP(config.oauth.tokenUrl, "tokenUrl");
      this.getToken = (options) => this.fetchOAuthToken(config.oauth as ProducerOAuthConfig, options);
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
    this.compressionEnabled = config.compression?.enabled ?? true;
    this.compressionThresholdBytes = config.compression?.thresholdBytes ?? 1024;
    this.admin = new AdminNamespace((method, path, body) => this.adminRequest(method, path, body));
    this.provisioning = new ProvisioningNamespace((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.reporting = new ReportingNamespace((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.schemas = new SchemaNamespace((method, path, body) => this.apiRequest(method, path, body));

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
    this.removeFlushTriggers = (config.queue?.flushTriggers ?? []).map((install) => install(() => this.flush()));
  }

  // fromProvisionedProducer builds an event-producing client directly from a
  // provisioned producer bundle, hiding the OAuth wiring.
  static fromProvisionedProducer(credentials: ProvisionedProducerCredentials): CustdClient {
    if (!credentials.clientSecret) {
      throw new Error("custd: provisioned producer bundle is missing the client secret");
    }
    return new CustdClient({
      baseUrl: credentials.baseUrl,
      oauth: {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tokenUrl: credentials.tokenUrl,
        audience: credentials.audience,
        scopes: credentials.scopes,
      },
    });
  }

  static fromBrokerEnv(env: BrokerEnv, options: BrokerEnvClientOptions = {}): CustdClient {
    const baseUrl = options.baseUrl ?? brokerBaseUrl(env);
    return new CustdClient({
      ...options,
      baseUrl,
      oauth: {
        clientId: requireBrokerEnv(env, "CUSTD_PROVISIONING_CLIENT_ID", "PROVISIONING_CLIENT_ID"),
        clientSecret: requireBrokerEnv(env, "CUSTD_PROVISIONING_CLIENT_SECRET", "PROVISIONING_CLIENT_SECRET"),
        tokenUrl: requireBrokerEnv(env, "CUSTD_PROVISIONING_TOKEN_URL", "PROVISIONING_TOKEN_URL"),
        audience: brokerEnvValue(env, "CUSTD_PROVISIONING_AUDIENCE", "PROVISIONING_AUDIENCE"),
        scopes: options.scopes ?? ["admin", "producers.provision"],
      },
    });
  }

  private async fetchOAuthToken(config: ProducerOAuthConfig, options?: RequestOptions): Promise<string> {
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

    const response = await this.fetchImpl(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new Error(`custd: token request failed with status ${response.status}`);
    }
    const token = (await response.json()) as { access_token?: string; expires_in?: number };
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

  // biome-ignore lint/suspicious/noConfusingVoidType: public return type — track() resolves to nothing when queued, or a Response when sent immediately.
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
    for (const remove of this.removeFlushTriggers) {
      remove();
    }
    this.removeFlushTriggers = [];
  }

  private async sendWithRetry(event: EventEnvelope): Promise<Response> {
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const response = await this.fetchImpl(`${this.baseUrl}/api/v1/events`, {
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
        throw await problemError(response, `custd: request failed with status ${response.status}`);
      }

      return response;
    });
  }

  private async sendBatchWithRetry(events: EventEnvelope[]): Promise<Response> {
    const json = JSON.stringify({ events });
    const { body, contentEncoding } = await this.encodeBatchBody(json);
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...this.defaultHeaders,
      };
      if (contentEncoding) {
        headers["Content-Encoding"] = contentEncoding;
      }
      const response = await this.fetchImpl(`${this.baseUrl}/api/v1/events/batch`, {
        method: "POST",
        headers,
        body,
      });

      await this.assertBatchResponse(response);
      return response;
    });
  }

  // encodeBatchBody gzip-compresses the serialized batch body when compression
  // is enabled and the body meets the threshold. It falls back to the raw JSON
  // string (no Content-Encoding) when compression is disabled, below threshold,
  // or CompressionStream is unavailable in the runtime.
  private async encodeBatchBody(json: string): Promise<{ body: BodyInit; contentEncoding?: string }> {
    if (!this.compressionEnabled || json.length < this.compressionThresholdBytes) {
      return { body: json };
    }
    if (typeof CompressionStream === "undefined") {
      return { body: json };
    }
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return { body: compressed, contentEncoding: "gzip" };
  }

  private async assertBatchResponse(response: Response): Promise<void> {
    if (!response.ok) {
      const retryable = this.retry.retryOnStatuses.includes(response.status);
      if (retryable) {
        throw new RetryableError(`custd: retryable status ${response.status}`);
      }
      throw await problemError(response, `custd: request failed with status ${response.status}`);
    }

    const text = await response.text();
    if (text === "") {
      return;
    }
    const body = JSON.parse(text) as EventBatchResponse;
    // Validate every per-event result, not just HTTP status: a 202 envelope can
    // still carry rejected events with their own non-2xx status and problem.
    const failed = (body.results ?? []).filter((r) => r.success === false);
    if (failed.length > 0) {
      throw new CustdProblemError(this.batchRejectionMessage(response.status, body.results, failed), undefined, failed);
    }
  }

  // Names the rejected events (uuid, status, reason) so a partial batch failure
  // is diagnosable without re-probing the API. The list is capped to keep the
  // message bounded.
  private batchRejectionMessage(status: number, results: EventResult[] | undefined, failed: EventResult[]): string {
    const maxList = 10;
    const parts = failed.slice(0, maxList).map((r) => {
      const reason = r.error?.detail || r.error?.title || "no error detail";
      return `${r.eventUuid ?? "unknown"} [status ${r.status ?? status}] ${reason}`;
    });
    if (failed.length > maxList) {
      parts.push(`+${failed.length - maxList} more`);
    }
    return `custd: batch rejected ${failed.length} of ${results?.length ?? failed.length} event(s): ${parts.join("; ")}`;
  }

  private async adminRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.apiRequest(method, `/admin${path}`, body);
  }

  private async apiRequest<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const token = await this.getToken(options);
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...this.defaultHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`custd: request failed with status ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}

type AdminRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
type SchemaRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
type APIRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

class ReportingNamespace {
  constructor(private readonly request: APIRequester) {}

  dashboard(key: string, options?: RequestOptions): Promise<ReportingDashboard> {
    return this.request("GET", `/reporting/dashboards/${encodeURIComponent(key)}`, undefined, options);
  }

  async query(request: ReportingQueryRequest, options?: RequestOptions): Promise<ReportingWidgetData> {
    const data = await this.request<ReportingWidgetData>("POST", "/reporting/query", request, options);
    if (data.trust && containsForbiddenReportingTrustKey(data.trust)) {
      throw new Error("custd: unsafe reporting trust diagnostics");
    }
    return data;
  }
}

class SchemaNamespace {
  constructor(private readonly request: SchemaRequester) {}

  validate(input: SchemaValidationRequest): Promise<SchemaValidationResponse> {
    return this.request("POST", "/schemas/validate", input);
  }

  dryRun(input: SchemaValidationRequest): Promise<SchemaValidationResponse> {
    return this.request("POST", "/schemas/dry-run", input);
  }

  infer(input: SchemaInferenceRequest): Promise<SchemaInferenceResponse> {
    return this.request("POST", "/schemas/infer", input);
  }

  async sendTestEvent(event: EventEnvelope): Promise<SendTestEventResponse> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    const response = await this.request<SendTestEventResponse>("POST", "/events", prepared);
    if (!response.success || response.eventUuid !== prepared.eventUuid) {
      throw new Error("custd: test event was not accepted by ingest");
    }
    return response;
  }
}

class AdminNamespace {
  readonly tenants: AdminTenantNamespace;
  readonly oauthClients: AdminOAuthClientNamespace;
  readonly sites: AdminSiteNamespace;
  readonly schemas: AdminSchemaNamespace;
  readonly measurement: AdminMeasurementNamespace;

  constructor(request: AdminRequester) {
    this.tenants = new AdminTenantNamespace(request);
    this.oauthClients = new AdminOAuthClientNamespace(request);
    this.sites = new AdminSiteNamespace(request);
    this.schemas = new AdminSchemaNamespace(request);
    this.measurement = new AdminMeasurementNamespace(request);
  }
}

class ProvisioningNamespace {
  readonly dataSpaces: ProvisioningDataSpaceNamespace;
  readonly producers: ProvisioningProducerNamespace;

  constructor(request: APIRequester) {
    this.dataSpaces = new ProvisioningDataSpaceNamespace(request);
    this.producers = new ProvisioningProducerNamespace(request);
  }
}

class ProvisioningDataSpaceNamespace {
  constructor(private readonly request: APIRequester) {}

  create(dataSpace: DataSpaceCreate): Promise<DataSpace> {
    return this.request("POST", "/data-spaces", dataSpace);
  }

  list(): Promise<DataSpaceListResponse> {
    return this.request("GET", "/data-spaces");
  }

  revoke(slug: string): Promise<void> {
    return this.request("DELETE", `/data-spaces/${encodeURIComponent(slug)}`);
  }
}

class ProvisioningProducerNamespace {
  constructor(private readonly request: APIRequester) {}

  provision(request: ProducerProvisionCreate): Promise<ProvisionedProducerCredentials> {
    return this.request("POST", "/producer-provisioning", request);
  }

  list(companySlug?: string): Promise<ProducerProvisionPublicClient[]> {
    const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
    return this.request("GET", `/producer-provisioning${query}`);
  }

  rotateSecret(clientId: string): Promise<ProvisionedProducerCredentials> {
    return this.request("POST", `/producer-provisioning/${encodeURIComponent(clientId)}/rotate-secret`);
  }

  revoke(clientId: string): Promise<void> {
    return this.request("DELETE", `/producer-provisioning/${encodeURIComponent(clientId)}`);
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
    const site = await this.request<AdminSite & { writeKey?: unknown }>(
      "GET",
      `/sites/${encodeURIComponent(siteUuid)}`,
    );
    return publicAdminSite(site);
  }

  delete(siteUuid: string): Promise<void> {
    return this.request("DELETE", `/sites/${encodeURIComponent(siteUuid)}`);
  }

  rotateWriteKey(siteUuid: string): Promise<AdminSiteWriteKeyResponse> {
    return this.request("POST", `/sites/${encodeURIComponent(siteUuid)}/rotate-write-key`);
  }
}

class AdminSchemaNamespace {
  constructor(private readonly request: AdminRequester) {}

  list(): Promise<AdminSchemaListResponse> {
    return this.request("GET", "/schemas");
  }

  get(eventTypeSlug: string): Promise<AdminSchema> {
    return this.request("GET", `/schemas/${encodeURIComponent(eventTypeSlug)}`);
  }

  register(schema: AdminSchemaRegister): Promise<AdminSchema> {
    return this.request("POST", "/schemas", schema);
  }

  createVersion(eventTypeSlug: string, schema: AdminSchemaVersionCreate): Promise<AdminSchema> {
    return this.request("POST", `/schemas/${encodeURIComponent(eventTypeSlug)}/versions`, schema);
  }
}

class AdminMeasurementNamespace {
  readonly projects: AdminMeasurementProjectNamespace;

  constructor(request: AdminRequester) {
    this.projects = new AdminMeasurementProjectNamespace(request);
  }
}

class AdminMeasurementProjectNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(project: MeasurementProjectCreate): Promise<MeasurementProject> {
    return this.request("POST", "/measurement/projects", project);
  }

  list(): Promise<MeasurementProjectListResponse> {
    return this.request("GET", "/measurement/projects");
  }

  get(projectUuid: string): Promise<MeasurementProject> {
    return this.request("GET", `/measurement/projects/${encodeURIComponent(projectUuid)}`);
  }

  submitObservation(
    projectUuid: string,
    observation: MeasurementObservationInput,
  ): Promise<MeasurementObservationBulkResponse> {
    return this.submitObservations(projectUuid, { rows: [observation] });
  }

  async submitObservations(
    projectUuid: string,
    request: MeasurementObservationBulkRequest,
  ): Promise<MeasurementObservationBulkResponse> {
    const response = await this.request<MeasurementObservationBulkResponse>(
      "POST",
      `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:bulk`,
      request,
    );
    validateMeasurementResults(response.results, request.rows.length);
    return response;
  }

  async importCSVString(projectUuid: string, csv: string, expectedRows: number): Promise<MeasurementCSVImportResponse> {
    const response = await this.request<MeasurementCSVImportResponse>(
      "POST",
      `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:csv`,
      { csv },
    );
    validateMeasurementResults(response.results, expectedRows);
    return response;
  }
}

function validateMeasurementResults(results: MeasurementObservationResult[], submittedRows: number): void {
  if (results.length !== submittedRows) {
    throw new Error(
      `custd: measurement result count ${results.length} does not match submitted row count ${submittedRows}`,
    );
  }
  results.forEach((result, index) => {
    if (result.success && !result.observationUuid) {
      throw new Error(`custd: measurement result ${index} missing observationUuid`);
    }
  });
}

export type PrepareEventMode = "producer" | "browser-cookieless";

export type PrepareEventOptions = {
  mode?: PrepareEventMode;
};

// redactedProvisionedProducer returns the display-safe view of a provisioned
// producer bundle, omitting the client secret so it is safe for dashboards.
export function redactedProvisionedProducer(
  credentials: ProvisionedProducerCredentials,
): RedactedProvisionedProducerCredentials {
  const { clientSecret: _clientSecret, ...rest } = credentials;
  return rest;
}

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

  const sanitized = sanitizeDogfoodPayload(input.payload ?? {});
  if (input.strictPayloadKeys && sanitized.droppedKeys.length > 0) {
    throw new Error(`custd: dropped dogfood payload keys: ${sanitized.droppedKeys.join(", ")}`);
  }
  const payload = sanitized.payload;
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

// CustdProblemError carries the decoded RFC 9457 problem document (when the
// server sent one) and, for batch sends, the failed per-event results so a
// caller can inspect every rejection without re-probing the API.
export class CustdProblemError extends Error {
  readonly problem?: ProblemDetails;
  readonly failures: EventResult[];

  constructor(message: string, problem?: ProblemDetails, failures: EventResult[] = []) {
    super(message);
    this.name = "CustdProblemError";
    this.problem = problem;
    this.failures = failures;
  }
}

// problemError decodes an RFC 9457 problem document from an error response and
// wraps it in a CustdProblemError. When the body is missing or unparseable it
// falls back to the supplied status-only message so callers still get an error.
async function problemError(response: Response, fallbackMessage: string): Promise<CustdProblemError> {
  const text = await response.text().catch(() => "");
  if (text === "") {
    return new CustdProblemError(fallbackMessage);
  }
  let problem: ProblemDetails;
  try {
    problem = JSON.parse(text) as ProblemDetails;
  } catch {
    return new CustdProblemError(fallbackMessage);
  }
  const message = problem.detail || problem.title || fallbackMessage;
  return new CustdProblemError(`custd: ${message}`, problem);
}

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

const forbiddenReportingTrustKeys = new Set([
  "rawpayload",
  "sql",
  "token",
  "secret",
  "stack",
  "email",
  "ipaddress",
  "hostname",
  "orderid",
  "carttoken",
]);

function containsForbiddenReportingTrustKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenReportingTrustKey);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.entries(value).some(
    ([key, child]) => forbiddenReportingTrustKeys.has(key.toLowerCase()) || containsForbiddenReportingTrustKey(child),
  );
}

function sanitizeDogfoodPayload(
  payload: Record<string, unknown>,
  prefix = "",
): { payload: Record<string, unknown>; droppedKeys: string[] } {
  const cleaned: Record<string, unknown> = {};
  const droppedKeys: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (!dogfoodPayloadFieldAllowed(key)) {
      droppedKeys.push(`${prefix}${key}`);
      continue;
    }
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeDogfoodPayload(value as Record<string, unknown>, `${prefix}${key}.`);
      cleaned[key] = nested.payload;
      droppedKeys.push(...nested.droppedKeys);
    } else {
      cleaned[key] = value;
    }
  }
  return { payload: cleaned, droppedKeys };
}

function dogfoodPayloadFieldAllowed(key: string): boolean {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return !dogfoodProtectedPayloadFields.has(normalized) && !dogfoodForbiddenPayloadFields.has(normalized);
}

function brokerBaseUrl(env: BrokerEnv): string {
  const explicit = brokerEnvValue(env, "CUSTD_BASE_URL", "CUSTD_API_BASE_URL");
  if (explicit) {
    return normalizeCustdBaseUrl(explicit);
  }
  const endpoint = brokerEnvValue(
    env,
    "CUSTD_PROVISIONING_ENDPOINT",
    "PROVISIONING_ENDPOINT",
    "CUSTD_TENANT_ADMIN_ENDPOINT",
    "TENANT_ADMIN_ENDPOINT",
  );
  if (!endpoint) {
    throw new Error("custd: broker env missing CUSTD_BASE_URL or CUSTD_PROVISIONING_ENDPOINT");
  }
  return normalizeCustdBaseUrl(endpoint);
}

function normalizeCustdBaseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const suffixes = [
    "/api/v1/managed-audit/provision",
    "/api/v1/producer-provisioning",
    "/api/v1/admin/tenants",
    "/api/v1",
  ];
  for (const suffix of suffixes) {
    if (url.pathname.endsWith(suffix)) {
      url.pathname = url.pathname.slice(0, -suffix.length) || "/";
      break;
    }
  }
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function requireBrokerEnv(env: BrokerEnv, ...keys: string[]): string {
  const value = brokerEnvValue(env, ...keys);
  if (!value) {
    throw new Error(`custd: broker env missing ${keys[0]}`);
  }
  return value;
}

function brokerEnvValue(env: BrokerEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
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
  const exp = options.baseDelayMs * 2 ** (attempt - 1);
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
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}
