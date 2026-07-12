function publicAdminSite(site) {
    const { writeKey: _writeKey, ...safeSite } = site;
    return safeSite;
}
export class MemoryQueueStorage {
    constructor() {
        this.events = [];
    }
    load() {
        return [...this.events];
    }
    save(events) {
        this.events = [...events];
    }
    clear() {
        this.events = [];
    }
}
export class LocalStorageQueueStorage {
    constructor(key = "custd_event_queue") {
        this.key = key;
    }
    load() {
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
                return parsed;
            }
        }
        catch {
            return [];
        }
        return [];
    }
    save(events) {
        if (typeof localStorage === "undefined") {
            return;
        }
        localStorage.setItem(this.key, JSON.stringify(events));
    }
    clear() {
        if (typeof localStorage === "undefined") {
            return;
        }
        localStorage.removeItem(this.key);
    }
}
export class CustdClient {
    constructor(config) {
        this.queue = [];
        this.onlineHandler = null;
        this.batchTimer = null;
        this.removeFlushTriggers = [];
        this.oauthToken = null;
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.fetchImpl = config.fetch ?? globalThis.fetch;
        assertSecureOrLocalHTTP(this.baseUrl, "baseUrl");
        if (config.oauth) {
            assertSecureOrLocalHTTP(config.oauth.tokenUrl, "tokenUrl");
            this.getToken = (options) => this.fetchOAuthToken(config.oauth, options);
        }
        else if (config.getToken) {
            this.getToken = config.getToken;
        }
        else {
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
        this.provisioning = new ProvisioningNamespace((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.reporting = new ReportingNamespace((method, path, body, options) => this.apiRequest(method, path, body, options));
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
    static fromProvisionedProducer(credentials) {
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
    static fromBrokerEnv(env, options = {}) {
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
    async fetchOAuthToken(config, options) {
        const now = Date.now();
        if (this.oauthToken && this.oauthToken.expiresAtMs > now + 30000) {
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
        const token = (await response.json());
        if (!token.access_token) {
            throw new Error("custd: token response missing access_token");
        }
        this.oauthToken = {
            value: token.access_token,
            expiresAtMs: now + Math.max(0, token.expires_in ?? 300) * 1000,
        };
        return token.access_token;
    }
    async ingestEvent(event) {
        const prepared = prepareEvent(event);
        validateEvent(prepared);
        return this.sendWithRetry(prepared);
    }
    // biome-ignore lint/suspicious/noConfusingVoidType: public return type — track() resolves to nothing when queued, or a Response when sent immediately.
    async track(event) {
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
        }
        else if (isOnline()) {
            await this.flush();
        }
        return undefined;
    }
    enqueue(event) {
        if (!this.queueEnabled) {
            return;
        }
        if (this.queue.length >= this.maxQueueSize) {
            this.queue.shift();
        }
        this.queue.push(event);
        this.queueStorage.save(this.queue);
    }
    async flush() {
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
        }
        catch (err) {
            this.queue = [...toSend, ...this.queue];
            this.queueStorage.save(this.queue);
            throw err;
        }
        this.queueStorage.save(this.queue);
    }
    close() {
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
    async sendWithRetry(event) {
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
    async sendBatchWithRetry(events) {
        const json = JSON.stringify({ events });
        const { body, contentEncoding } = await this.encodeBatchBody(json);
        return withRetry(this.retry, async () => {
            const token = await this.getToken();
            const headers = {
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
    async encodeBatchBody(json) {
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
    async assertBatchResponse(response) {
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
        const body = JSON.parse(text);
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
    batchRejectionMessage(status, results, failed) {
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
    async adminRequest(method, path, body) {
        return this.apiRequest(method, `/admin${path}`, body);
    }
    async apiRequest(method, path, body, options) {
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
            return undefined;
        }
        return (await response.json());
    }
}
class ReportingNamespace {
    constructor(request) {
        this.request = request;
    }
    dashboard(key, options) {
        return this.request("GET", `/reporting/dashboards/${encodeURIComponent(key)}`, undefined, options);
    }
    async query(request, options) {
        const data = await this.request("POST", "/reporting/query", request, options);
        if (data.trust && containsForbiddenReportingTrustKey(data.trust)) {
            throw new Error("custd: unsafe reporting trust diagnostics");
        }
        return data;
    }
}
class SchemaNamespace {
    constructor(request) {
        this.request = request;
    }
    validate(input) {
        return this.request("POST", "/schemas/validate", input);
    }
    dryRun(input) {
        return this.request("POST", "/schemas/dry-run", input);
    }
    infer(input) {
        return this.request("POST", "/schemas/infer", input);
    }
    async sendTestEvent(event) {
        const prepared = prepareEvent(event);
        validateEvent(prepared);
        const response = await this.request("POST", "/events", prepared);
        if (!response.success || response.eventUuid !== prepared.eventUuid) {
            throw new Error("custd: test event was not accepted by ingest");
        }
        return response;
    }
}
class AdminNamespace {
    constructor(request) {
        this.tenants = new AdminTenantNamespace(request);
        this.oauthClients = new AdminOAuthClientNamespace(request);
        this.sites = new AdminSiteNamespace(request);
        this.schemas = new AdminSchemaNamespace(request);
        this.measurement = new AdminMeasurementNamespace(request);
    }
}
class ProvisioningNamespace {
    constructor(request) {
        this.dataSpaces = new ProvisioningDataSpaceNamespace(request);
        this.producers = new ProvisioningProducerNamespace(request);
    }
}
class ProvisioningDataSpaceNamespace {
    constructor(request) {
        this.request = request;
    }
    create(dataSpace) {
        return this.request("POST", "/data-spaces", dataSpace);
    }
    list() {
        return this.request("GET", "/data-spaces");
    }
    revoke(slug) {
        return this.request("DELETE", `/data-spaces/${encodeURIComponent(slug)}`);
    }
}
class ProvisioningProducerNamespace {
    constructor(request) {
        this.request = request;
    }
    provision(request) {
        return this.request("POST", "/producer-provisioning", request);
    }
    list(companySlug) {
        const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
        return this.request("GET", `/producer-provisioning${query}`);
    }
    rotateSecret(clientId) {
        return this.request("POST", `/producer-provisioning/${encodeURIComponent(clientId)}/rotate-secret`);
    }
    revoke(clientId) {
        return this.request("DELETE", `/producer-provisioning/${encodeURIComponent(clientId)}`);
    }
}
class AdminTenantNamespace {
    constructor(request) {
        this.request = request;
    }
    create(tenant) {
        return this.request("POST", "/tenants", tenant);
    }
    list() {
        return this.request("GET", "/tenants");
    }
    get(slug) {
        return this.request("GET", `/tenants/${encodeURIComponent(slug)}`);
    }
    delete(slug) {
        return this.request("DELETE", `/tenants/${encodeURIComponent(slug)}`);
    }
}
class AdminOAuthClientNamespace {
    constructor(request) {
        this.request = request;
    }
    create(client) {
        return this.request("POST", "/oauth-clients", client);
    }
    list() {
        return this.request("GET", "/oauth-clients");
    }
    get(clientId) {
        return this.request("GET", `/oauth-clients/${encodeURIComponent(clientId)}`);
    }
    delete(clientId) {
        return this.request("DELETE", `/oauth-clients/${encodeURIComponent(clientId)}`);
    }
    rotateSecret(clientId) {
        return this.request("POST", `/oauth-clients/${encodeURIComponent(clientId)}/rotate-secret`);
    }
}
class AdminSiteNamespace {
    constructor(request) {
        this.request = request;
    }
    create(site) {
        return this.request("POST", "/sites", site);
    }
    async list() {
        const response = await this.request("GET", "/sites");
        return { sites: response.sites.map(publicAdminSite) };
    }
    async get(siteUuid) {
        const site = await this.request("GET", `/sites/${encodeURIComponent(siteUuid)}`);
        return publicAdminSite(site);
    }
    delete(siteUuid) {
        return this.request("DELETE", `/sites/${encodeURIComponent(siteUuid)}`);
    }
    rotateWriteKey(siteUuid) {
        return this.request("POST", `/sites/${encodeURIComponent(siteUuid)}/rotate-write-key`);
    }
}
class AdminSchemaNamespace {
    constructor(request) {
        this.request = request;
    }
    list() {
        return this.request("GET", "/schemas");
    }
    get(eventTypeSlug) {
        return this.request("GET", `/schemas/${encodeURIComponent(eventTypeSlug)}`);
    }
    register(schema) {
        return this.request("POST", "/schemas", schema);
    }
    createVersion(eventTypeSlug, schema) {
        return this.request("POST", `/schemas/${encodeURIComponent(eventTypeSlug)}/versions`, schema);
    }
}
class AdminMeasurementNamespace {
    constructor(request) {
        this.projects = new AdminMeasurementProjectNamespace(request);
    }
}
class AdminMeasurementProjectNamespace {
    constructor(request) {
        this.request = request;
    }
    create(project) {
        return this.request("POST", "/measurement/projects", project);
    }
    list() {
        return this.request("GET", "/measurement/projects");
    }
    get(projectUuid) {
        return this.request("GET", `/measurement/projects/${encodeURIComponent(projectUuid)}`);
    }
    submitObservation(projectUuid, observation) {
        return this.submitObservations(projectUuid, { rows: [observation] });
    }
    async submitObservations(projectUuid, request) {
        const response = await this.request("POST", `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:bulk`, request);
        validateMeasurementResults(response.results, request.rows.length);
        return response;
    }
    async importCSVString(projectUuid, csv, expectedRows) {
        const response = await this.request("POST", `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:csv`, { csv });
        validateMeasurementResults(response.results, expectedRows);
        return response;
    }
}
function validateMeasurementResults(results, submittedRows) {
    if (results.length !== submittedRows) {
        throw new Error(`custd: measurement result count ${results.length} does not match submitted row count ${submittedRows}`);
    }
    results.forEach((result, index) => {
        if (result.success && !result.observationUuid) {
            throw new Error(`custd: measurement result ${index} missing observationUuid`);
        }
    });
}
// redactedProvisionedProducer returns the display-safe view of a provisioned
// producer bundle, omitting the client secret so it is safe for dashboards.
export function redactedProvisionedProducer(credentials) {
    const { clientSecret: _clientSecret, ...rest } = credentials;
    return rest;
}
export function validateEvent(event) {
    const missing = [];
    if (!event.eventUuid)
        missing.push("eventUuid");
    if (!event.eventTypeSlug)
        missing.push("eventTypeSlug");
    if (!event.schemaVersion)
        missing.push("schemaVersion");
    if (!event.timestamp)
        missing.push("timestamp");
    if (!event.sessionId)
        missing.push("sessionId");
    if (!event.anonymousId)
        missing.push("anonymousId");
    if (!event.companySlug)
        missing.push("companySlug");
    if (!event.context)
        missing.push("context");
    if (!event.payload)
        missing.push("payload");
    const deviceType = event.context?.device?.type;
    if (!deviceType)
        missing.push("context.device.type");
    if (missing.length > 0) {
        throw new Error(`custd: missing required fields: ${missing.join(", ")}`);
    }
}
export function validateBrowserEvent(event) {
    const missing = [];
    if (!event.eventUuid)
        missing.push("eventUuid");
    if (!event.eventTypeSlug)
        missing.push("eventTypeSlug");
    if (!event.schemaVersion)
        missing.push("schemaVersion");
    if (!event.timestamp)
        missing.push("timestamp");
    if (!event.context)
        missing.push("context");
    if (!event.payload)
        missing.push("payload");
    if (!event.payload?.siteUuid)
        missing.push("payload.siteUuid");
    const deviceType = event.context?.device?.type;
    if (!deviceType)
        missing.push("context.device.type");
    if (missing.length > 0) {
        throw new Error(`custd: missing required browser fields: ${missing.join(", ")}`);
    }
}
export function createDogfoodEvent(input) {
    const missing = [];
    if (!input.eventTypeSlug)
        missing.push("eventTypeSlug");
    if (!input.schemaVersion)
        missing.push("schemaVersion");
    if (!input.companySlug)
        missing.push("companySlug");
    if (!input.sourceSystem)
        missing.push("sourceSystem");
    if (!input.sourceCompany)
        missing.push("sourceCompany");
    if (!input.environment)
        missing.push("environment");
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
export function prepareEvent(event, options = {}) {
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
export class RetryableError extends Error {
}
// CustdProblemError carries the decoded RFC 9457 problem document (when the
// server sent one) and, for batch sends, the failed per-event results so a
// caller can inspect every rejection without re-probing the API.
export class CustdProblemError extends Error {
    constructor(message, problem, failures = []) {
        super(message);
        this.name = "CustdProblemError";
        this.problem = problem;
        this.failures = failures;
    }
}
// problemError decodes an RFC 9457 problem document from an error response and
// wraps it in a CustdProblemError. When the body is missing or unparseable it
// falls back to the supplied status-only message so callers still get an error.
async function problemError(response, fallbackMessage) {
    const text = await response.text().catch(() => "");
    if (text === "") {
        return new CustdProblemError(fallbackMessage);
    }
    let problem;
    try {
        problem = JSON.parse(text);
    }
    catch {
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
function containsForbiddenReportingTrustKey(value) {
    if (Array.isArray(value)) {
        return value.some(containsForbiddenReportingTrustKey);
    }
    if (!value || typeof value !== "object") {
        return false;
    }
    return Object.entries(value).some(([key, child]) => forbiddenReportingTrustKeys.has(key.toLowerCase()) || containsForbiddenReportingTrustKey(child));
}
function sanitizeDogfoodPayload(payload, prefix = "") {
    const cleaned = {};
    const droppedKeys = [];
    for (const [key, value] of Object.entries(payload)) {
        if (!dogfoodPayloadFieldAllowed(key)) {
            droppedKeys.push(`${prefix}${key}`);
            continue;
        }
        if (value != null && typeof value === "object" && !Array.isArray(value)) {
            const nested = sanitizeDogfoodPayload(value, `${prefix}${key}.`);
            cleaned[key] = nested.payload;
            droppedKeys.push(...nested.droppedKeys);
        }
        else {
            cleaned[key] = value;
        }
    }
    return { payload: cleaned, droppedKeys };
}
function dogfoodPayloadFieldAllowed(key) {
    const normalized = key.toLowerCase().replace(/_/g, "");
    return !dogfoodProtectedPayloadFields.has(normalized) && !dogfoodForbiddenPayloadFields.has(normalized);
}
function brokerBaseUrl(env) {
    const explicit = brokerEnvValue(env, "CUSTD_BASE_URL", "CUSTD_API_BASE_URL");
    if (explicit) {
        return normalizeCustdBaseUrl(explicit);
    }
    const endpoint = brokerEnvValue(env, "CUSTD_PROVISIONING_ENDPOINT", "PROVISIONING_ENDPOINT", "CUSTD_TENANT_ADMIN_ENDPOINT", "TENANT_ADMIN_ENDPOINT");
    if (!endpoint) {
        throw new Error("custd: broker env missing CUSTD_BASE_URL or CUSTD_PROVISIONING_ENDPOINT");
    }
    return normalizeCustdBaseUrl(endpoint);
}
function normalizeCustdBaseUrl(rawUrl) {
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
function requireBrokerEnv(env, ...keys) {
    const value = brokerEnvValue(env, ...keys);
    if (!value) {
        throw new Error(`custd: broker env missing ${keys[0]}`);
    }
    return value;
}
function brokerEnvValue(env, ...keys) {
    for (const key of keys) {
        const value = env[key];
        if (typeof value === "string" && value.trim() !== "") {
            return value;
        }
    }
    return undefined;
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
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
export function normalizeRetryOptions(options) {
    return {
        maxAttempts: options?.maxAttempts ?? 3,
        baseDelayMs: options?.baseDelayMs ?? 200,
        maxDelayMs: options?.maxDelayMs ?? 2000,
        jitter: options?.jitter ?? 0.2,
        retryOnStatuses: options?.retryOnStatuses ?? [408, 429, 500, 502, 503, 504],
    };
}
export async function withRetry(options, op) {
    let attempt = 0;
    for (;;) {
        attempt++;
        try {
            return await op();
        }
        catch (err) {
            const retryable = err instanceof RetryableError || err instanceof TypeError;
            if (!retryable || attempt >= options.maxAttempts) {
                throw err;
            }
            const delay = backoffDelay(options, attempt);
            await sleep(delay);
        }
    }
}
function backoffDelay(options, attempt) {
    const exp = options.baseDelayMs * 2 ** (attempt - 1);
    const capped = Math.min(exp, options.maxDelayMs);
    const jitter = capped * options.jitter * (Math.random() * 2 - 1);
    return Math.max(0, capped + jitter);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isOnline() {
    if (typeof navigator === "undefined") {
        return true;
    }
    if (typeof navigator.onLine !== "boolean") {
        return true;
    }
    return navigator.onLine;
}
function randomUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16));
}
