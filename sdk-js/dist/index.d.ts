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
    strictPayloadKeys?: boolean;
    payload?: Record<string, unknown>;
};
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
export type ProducerOAuthConfig = {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    audience?: string;
    scopes?: string[];
};
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
    getToken?: () => string | Promise<string>;
    oauth?: ProducerOAuthConfig;
    defaultHeaders?: Record<string, string>;
    retry?: RetryOptions;
    batch?: BatchOptions;
    queue?: QueueOptions;
    compression?: CompressionOptions;
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
    projectSlug: string;
    name: string;
    kind: string;
    description?: string;
    series: MeasurementSeriesCreate[];
    target: MeasurementTargetCreate;
};
export type MeasurementProject = {
    projectUuid: string;
    projectSlug: string;
    name: string;
    kind: string;
    status: string;
    description?: string;
};
export type MeasurementProjectListResponse = {
    projects: MeasurementProject[];
};
export type MeasurementSeriesCreate = {
    seriesSlug: string;
    name: string;
    unit: string;
    completionDirection: string;
    source: string;
};
export type MeasurementTargetCreate = {
    targetSlug: string;
    name: string;
    targetValue: number;
    targetDate?: string;
    state: string;
};
export type MeasurementObservationInput = {
    seriesSlug: string;
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
    conflicts: Array<{
        field: string;
        message: string;
    }>;
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
export declare class MemoryQueueStorage implements QueueStorage {
    private events;
    load(): EventEnvelope[];
    save(events: EventEnvelope[]): void;
    clear(): void;
}
export declare class LocalStorageQueueStorage implements QueueStorage {
    private key;
    constructor(key?: string);
    load(): EventEnvelope[];
    save(events: EventEnvelope[]): void;
    clear(): void;
}
export declare class CustdClient {
    readonly admin: AdminNamespace;
    readonly provisioning: ProvisioningNamespace;
    readonly schemas: SchemaNamespace;
    private baseUrl;
    private getToken;
    private defaultHeaders;
    private retry;
    private batch;
    private queueEnabled;
    private queueStorage;
    private queue;
    private maxQueueSize;
    private flushOnOnline;
    private onlineHandler;
    private compressionEnabled;
    private compressionThresholdBytes;
    private batchTimer;
    private removeFlushTriggers;
    private oauthToken;
    constructor(config: ClientConfig);
    static fromProvisionedProducer(credentials: ProvisionedProducerCredentials): CustdClient;
    private fetchOAuthToken;
    ingestEvent(event: EventEnvelope): Promise<Response>;
    track(event: EventEnvelope): Promise<void | Response>;
    enqueue(event: EventEnvelope): void;
    flush(): Promise<void>;
    close(): void;
    private sendWithRetry;
    private sendBatchWithRetry;
    private encodeBatchBody;
    private assertBatchResponse;
    private batchRejectionMessage;
    private adminRequest;
    private apiRequest;
}
type AdminRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
type SchemaRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
type APIRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
declare class SchemaNamespace {
    private readonly request;
    constructor(request: SchemaRequester);
    validate(input: SchemaValidationRequest): Promise<SchemaValidationResponse>;
    dryRun(input: SchemaValidationRequest): Promise<SchemaValidationResponse>;
    infer(input: SchemaInferenceRequest): Promise<SchemaInferenceResponse>;
    sendTestEvent(event: EventEnvelope): Promise<SendTestEventResponse>;
}
declare class AdminNamespace {
    readonly tenants: AdminTenantNamespace;
    readonly oauthClients: AdminOAuthClientNamespace;
    readonly sites: AdminSiteNamespace;
    readonly schemas: AdminSchemaNamespace;
    readonly measurement: AdminMeasurementNamespace;
    constructor(request: AdminRequester);
}
declare class ProvisioningNamespace {
    readonly dataSpaces: ProvisioningDataSpaceNamespace;
    readonly producers: ProvisioningProducerNamespace;
    constructor(request: APIRequester);
}
declare class ProvisioningDataSpaceNamespace {
    private readonly request;
    constructor(request: APIRequester);
    create(dataSpace: DataSpaceCreate): Promise<DataSpace>;
    list(): Promise<DataSpaceListResponse>;
    revoke(slug: string): Promise<void>;
}
declare class ProvisioningProducerNamespace {
    private readonly request;
    constructor(request: APIRequester);
    provision(request: ProducerProvisionCreate): Promise<ProvisionedProducerCredentials>;
    list(companySlug?: string): Promise<ProducerProvisionPublicClient[]>;
    rotateSecret(clientId: string): Promise<ProvisionedProducerCredentials>;
    revoke(clientId: string): Promise<void>;
}
declare class AdminTenantNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(tenant: AdminTenantCreate): Promise<AdminTenant>;
    list(): Promise<AdminTenantListResponse>;
    get(slug: string): Promise<AdminTenant>;
    delete(slug: string): Promise<void>;
}
declare class AdminOAuthClientNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(client: AdminOAuthClientCreate): Promise<AdminOAuthClientCreateResponse>;
    list(): Promise<AdminOAuthClientListResponse>;
    get(clientId: string): Promise<AdminOAuthClient>;
    delete(clientId: string): Promise<void>;
    rotateSecret(clientId: string): Promise<AdminOAuthClientSecretResponse>;
}
declare class AdminSiteNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(site: AdminSiteCreate): Promise<AdminSiteCreateResponse>;
    list(): Promise<AdminSiteListResponse>;
    get(siteUuid: string): Promise<AdminSite>;
    delete(siteUuid: string): Promise<void>;
    rotateWriteKey(siteUuid: string): Promise<AdminSiteWriteKeyResponse>;
}
declare class AdminSchemaNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    list(): Promise<AdminSchemaListResponse>;
    get(eventTypeSlug: string): Promise<AdminSchema>;
    register(schema: AdminSchemaRegister): Promise<AdminSchema>;
    createVersion(eventTypeSlug: string, schema: AdminSchemaVersionCreate): Promise<AdminSchema>;
}
declare class AdminMeasurementNamespace {
    readonly projects: AdminMeasurementProjectNamespace;
    constructor(request: AdminRequester);
}
declare class AdminMeasurementProjectNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(project: MeasurementProjectCreate): Promise<MeasurementProject>;
    list(): Promise<MeasurementProjectListResponse>;
    get(projectSlug: string): Promise<MeasurementProject>;
    submitObservation(projectSlug: string, observation: MeasurementObservationInput): Promise<MeasurementObservationBulkResponse>;
    submitObservations(projectSlug: string, request: MeasurementObservationBulkRequest): Promise<MeasurementObservationBulkResponse>;
    importCSVString(projectSlug: string, csv: string, expectedRows: number): Promise<MeasurementCSVImportResponse>;
}
export type PrepareEventMode = "producer" | "browser-cookieless";
export type PrepareEventOptions = {
    mode?: PrepareEventMode;
};
export declare function redactedProvisionedProducer(credentials: ProvisionedProducerCredentials): RedactedProvisionedProducerCredentials;
export declare function validateEvent(event: EventEnvelope): void;
export declare function validateBrowserEvent(event: EventEnvelope): void;
export declare function createDogfoodEvent(input: DogfoodEventInput): EventEnvelope;
export declare function prepareEvent(event: EventEnvelope, options?: PrepareEventOptions): EventEnvelope;
export declare class RetryableError extends Error {
}
export declare class CustdProblemError extends Error {
    readonly problem?: ProblemDetails;
    readonly failures: EventResult[];
    constructor(message: string, problem?: ProblemDetails, failures?: EventResult[]);
}
export declare function normalizeRetryOptions(options?: RetryOptions): Required<RetryOptions>;
export declare function withRetry<T>(options: Required<RetryOptions>, op: () => Promise<T>): Promise<T>;
export {};
