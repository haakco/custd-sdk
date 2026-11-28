import { AuthProjectAdminClient } from "./admin-auth-projects.js";
import { ClientSetupClient } from "./admin-client-setup.js";
import { DataLabelAdminClient } from "./admin-data-labels.js";
import { DataScopeAdminClient, validDataScopeCode } from "./admin-data-scopes.js";
import { OffboardingClient, } from "./admin-offboarding.js";
import { PredictionAdminClient } from "./admin-predictions.js";
import { PrivacyErasureClient } from "./admin-privacy-erasures.js";
import { RetentionClient } from "./admin-retention.js";
import { SiteDomainAdminClient } from "./admin-site-domains.js";
import { SiteInsightsAdminClient } from "./admin-site-insights-tasks.js";
import { SubjectExportClient } from "./admin-subject-exports.js";
import { TenantStorageClient } from "./admin-tenant-storage.js";
import { AppMessageClient } from "./app-messages.js";
import { responseDownloadStream } from "./download-stream.js";
import { isLocalHostname } from "./secure-url.js";
import { StorefrontClient } from "./storefront.js";
export { AUTH_PROJECT_DOMAIN_CONVERGENCES, AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS, AUTH_PROJECT_DOMAIN_IMAGE_SOURCES, AUTH_PROJECT_DOMAIN_LIFECYCLES, AUTH_PROJECT_DOMAIN_STATUSES, } from "./admin-auth-project-domain.js";
export { ADMIN_USER_GLOBAL_STATES, ADMIN_USER_MEMBERSHIP_STATES, ADMIN_USER_ROLES, AdminUserAdminClient, } from "./admin-users.js";
export { WORKFLOW_TIMING_FACT_KINDS, WORKFLOW_TIMING_STATES, WorkflowTimingAdminClient, } from "./admin-workflow-timings.js";
import { AccountingEvidenceAdminClient } from "./admin-accounting-evidence.js";
import { CampaignEmailAdminClient } from "./admin-campaign-email.js";
import { EmailRelayAdminClient } from "./admin-email-relay.js";
import { EnvironmentPolicyAdminClient } from "./admin-environment-policy.js";
import { ErrorIssueAdminClient } from "./admin-error-issues.js";
import { EventTypeAdminClient } from "./admin-event-types.js";
import { ImpersonationAdminClient } from "./admin-impersonation.js";
import { IngestClaimAdminClient } from "./admin-ingest-claims.js";
import { MachineAccessAdminClient } from "./admin-machine-access.js";
import { ManagedAuditAdminClient } from "./admin-managed-audit.js";
import { AdminMeasurementNamespace } from "./admin-measurement-projects.js";
import { NotificationDestinationAdminClient } from "./admin-notification-destinations.js";
import { NotificationWebhookAdminClient } from "./admin-notification-webhooks.js";
import { OAuthClientAdmissionAdminClient } from "./admin-oauth-client-admissions.js";
import { RlsAdminClient } from "./admin-rls.js";
import { SdkUsageAdminClient } from "./admin-sdk-usage.js";
import { SupportAccessAdminClient } from "./admin-support-access.js";
import { SystemAdminClient } from "./admin-system.js";
import { TimePlanAdminClient } from "./admin-timeplans.js";
import { UncertaintyModelAdminClient } from "./admin-uncertainty-models.js";
import { UsageAdminClient } from "./admin-usage.js";
import { AdminUserAdminClient } from "./admin-users.js";
import { WorkflowTimingAdminClient } from "./admin-workflow-timings.js";
import { AnalyticsEventClient } from "./analytics-events.js";
import { BackendLifecycleClient } from "./backend-lifecycle.js";
import { IngestOperationsClient } from "./ingest-operations.js";
import { MeasurementClient } from "./measurement.js";
import { basicAuthorization } from "./oauth.js";
import { ParserClient } from "./parsers.js";
import { PublicReadClient } from "./public-reads.js";
import { emptyApiNullLists } from "./response-lists.js";
import { eventSchemaPath, schemaRegistryPath, } from "./schema-registry.js";
import { redeemSiteAIOwnerHandoff } from "./site-ai-owner.js";
import { SDK_IDENTITY } from "./version.js";
export { APP_ERROR_CODES, APP_REASON_CODES, APP_SIGN_IN_MODES, APP_STATUSES, } from "./admin-apps.js";
export { AuthProjectAdminClient, AuthProjectRealmNotConvergedError, AuthProjectRealmProvisionError, } from "./admin-auth-projects.js";
export { ClientSetupClient, validateClientSetupManifest, } from "./admin-client-setup.js";
export { DataLabelAdminClient, } from "./admin-data-labels.js";
export { DataScopeAdminClient, validDataScopeCode, validDataScopeName, } from "./admin-data-scopes.js";
export { OffboardingClient, } from "./admin-offboarding.js";
export { PredictionAdminClient, } from "./admin-predictions.js";
export { PrivacyErasureClient, PrivacyErasureError, } from "./admin-privacy-erasures.js";
export { RetentionClient, } from "./admin-retention.js";
export { SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE, SITE_ANALYTICS_PROPERTY_INVALID_CODE, SITE_ANALYTICS_PROVIDER_GA4, SiteAnalyticsUnavailableReport, } from "./admin-site-analytics.js";
export { SITE_AUDIT_PAGES_DEFAULT_LIMIT, SITE_AUDIT_PAGES_MAX_LIMIT, SITE_LIGHTHOUSE_MAX_EXTRA_PAGES, SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE, SiteAuditPageIndexability, SiteAuditRun, } from "./admin-site-audit-pages.js";
export { SITE_CAMPAIGN_LINK_LIMIT_CODE, SITE_CAMPAIGN_LINK_TAKEN_CODE, SITE_CAMPAIGN_LINKS_MAX, } from "./admin-site-campaign-links.js";
export { SITE_BROWSER_COLLECTOR_MODES, SITE_DOMAIN_NOT_VERIFIED_CODE, SITE_FINDING_DISMISSAL_SCOPES, SITE_SEARCH_CONNECTION_NOT_FOUND_CODE, SITE_SEARCH_NOT_CONFIGURED_CODE, SITE_SEARCH_RETRY_NOT_FAILING_CODE, SiteDomainAdminClient, SiteRule, } from "./admin-site-domains.js";
export { SITE_INSIGHTS_EXPORT_SCHEMA, SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT, SiteSearchMetricDimension, } from "./admin-site-export.js";
export { IndexNowSubmissionStatus, SITE_CHOICE_REQUIRED_CODE, SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE, SITE_INDEXNOW_KEY_UNVERIFIED_CODE, SITE_INDEXNOW_LIMIT_CODE, SITE_INDEXNOW_NOT_ENABLED_CODE, SITE_INDEXNOW_URLS_INVALID_CODE, SITE_PAGE_NOT_ON_DOMAIN_CODE, SITE_PAGE_NOT_READ_CODE, SITE_PAGE_RECHECK_LIMIT_CODE, SITE_PAGE_RECHECK_READ_LIMIT, SITE_SEARCH_INSPECTION_LIMIT_CODE, SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE, SITE_SEARCH_INSPECTION_URL_INVALID_CODE, SiteGeneratedFormat, SitePageCheckScope, SitePageRecheckState, SiteRemedyKind, } from "./admin-site-insights.js";
export { SiteInsightsAdminClient, SiteInsightsTaskName, } from "./admin-site-insights-tasks.js";
export { SiteLinkSource, SiteLinkSourceStatus, } from "./admin-site-links.js";
export { PRIVATE_UPTIME_FAILURES, PRIVATE_UPTIME_STATUSES, SITE_HEARTBEAT_OUTCOMES, SITE_HEARTBEAT_STATUSES, } from "./admin-site-monitors.js";
export { SITE_NEXT_ACTIONS_MAX, SiteNextActionKind, SiteNextActionPlace, SiteNotChecked, } from "./admin-site-next-actions.js";
export { SitePageLinkSourceWhere, SitePageQueriesState, SiteTitleTemplate, } from "./admin-site-page-queries.js";
export { SITE_RANKINGS_DAYS_INVALID_CODE, SITE_RANKINGS_DEFAULT_DAYS, SITE_RANKINGS_MAX_DAYS, SITE_TRACKED_KEYWORD_ALL, SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION, SITE_TRACKED_KEYWORD_DUPLICATE_CODE, SITE_TRACKED_KEYWORD_INVALID_CODE, SITE_TRACKED_KEYWORD_LIMIT_CODE, SITE_TRACKED_KEYWORD_NOT_FOUND_CODE, SITE_TRACKED_KEYWORDS_MAX, SiteRankDevice, SiteRankingsSource, SiteRankState, SiteTrackedKeywordStatus, } from "./admin-site-rankings.js";
export { SAVED_SITE_REPORT_LIMIT_CODE, SAVED_SITE_REPORT_NAME_TAKEN_CODE, SITE_SAVED_REPORTS_MAX, SiteReportTemplate, } from "./admin-site-saved-reports.js";
export { SEARCH_POOL_MIN_CONTRIBUTORS, SEARCH_POOL_MIN_IMPRESSIONS, SEARCH_POOL_QUERIES_DEFAULT_LIMIT, SEARCH_POOL_QUERIES_MAX_LIMIT, SEARCH_POOL_SEARCH_MAX_LENGTH, SEARCH_POOL_TERMS_VERSION, SEARCH_POOL_WINDOW_DAYS, SearchPoolAccess, SearchPoolDemandBand, SITE_SEARCH_POOL_NOT_JOINED_CODE, SITE_SEARCH_POOL_QUERY_INVALID_CODE, SITE_SEARCH_POOL_SETTING_INVALID_CODE, SITE_SEARCH_POOL_SITE_BOUND_CODE, } from "./admin-site-search-pool.js";
export { SITE_FINDING_IMPACT_DEFAULT_DAYS, SITE_FINDING_IMPACT_MAX_DAYS, SITE_FINDING_IMPACT_MIN_DAYS, SITE_SEARCH_VALUE_DEFAULT_DAYS, SITE_SEARCH_VALUE_MAX_DAYS, SITE_SEARCH_VALUE_MAX_GOALS, SITE_SEARCH_VALUE_MAX_PAGES, SiteFindingImpactStatus, SiteSearchGoalStatus, } from "./admin-site-search-value.js";
export { siteStatusPagePublicUrl, } from "./admin-site-status-page.js";
export { ACCESS_LOG_HOUR_INVALID_CODE, AccessLogHourStatus, SiteCrawlerIdentity, SiteReferrerClass, SiteTrafficDayCoverage, TRAFFIC_OTHER_KEY, } from "./admin-site-traffic.js";
export { SITE_KEYWORD_DEMAND_SOURCE_BING, SITE_KEYWORD_LIST_LIMIT_CODE, SITE_KEYWORD_LIST_NOT_FOUND_CODE, SiteContentGapCoverage, SiteKeywordDemandState, SiteTopicTrendSource, SiteTopicTrendStatus, SiteTrancoBand, SiteWebDomainRole, SiteWebInventoryStatus, SiteWebPageSource, } from "./admin-site-web-data.js";
export { SubjectExportClient, } from "./admin-subject-exports.js";
export { TenantStorageClient, } from "./admin-tenant-storage.js";
export { TimePlanAdminClient, validateTimePlanDefinition, } from "./admin-timeplans.js";
export { USAGE_DEFAULT_LIMIT, USAGE_MAX_LIMIT, UsageAdminClient, } from "./admin-usage.js";
export { ANALYTICS_MAX_LABEL_FILTERS, ANALYTICS_MAX_RANGE_DAYS, ANALYTICS_RANGE_GROUP_BY, AnalyticsEventClient, } from "./analytics-events.js";
export { BackendLifecycleClient, createVerifiedOffboardingExportReceiver, } from "./backend-lifecycle.js";
export { BrowserSignIn, createSignInCodeChallenge, DEFAULT_SIGN_IN_SCOPES, SIGN_IN_ERROR_CODES, SIGN_IN_STATUSES, SignInError, signInConfigFromDiscovery, } from "./browser-sign-in.js";
export { DEFAULT_PARSER_FRAMING_MAX_LINES, DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES, MAX_PARSER_FRAMING_LINES, MAX_PARSER_FRAMING_RECORD_BYTES, ParserClient, } from "./parsers.js";
export { classifyReportingData, getReportingViewState, reportingQueryKey, } from "./reporting-state.js";
export { checkRuntimeReadiness, } from "./runtime-readiness.js";
export { createMobileAsyncQueueStorage, createMobileFlushTriggers, } from "./mobile-adapter.js";
export { createMobileEvent, } from "./mobile-context.js";
export { AsyncEventQueue } from "./mobile-queue.js";
/**
 * Mint a fresh key from the current time and a random UUIDv4. Mint it ONCE per
 * request object so a resend reuses the key; a genuinely repeated occurrence
 * needs a new request object and therefore a new key.
 */
export function createRawRequestIdempotencyKey() {
    return `${Date.now()}:${randomUUID()}`;
}
/** Mint one prepared request with a fresh, retained idempotency key. */
export function createRawIngestRequest(input) {
    return { ...input, idempotencyKey: createRawRequestIdempotencyKey() };
}
export class AdminWorkflowError extends Error {
    constructor(status, reason, code, safeNextAction, 
    /** The server's request identifier, to quote in a support request; empty when unknown. */
    requestId = "") {
        let message = `custd: ${reason || "admin workflow request failed"} (status ${status})`;
        if (code)
            message += ` [code=${code}]`;
        if (safeNextAction)
            message += ` [safeNextAction=${safeNextAction}]`;
        super(message);
        this.status = status;
        this.reason = reason;
        this.code = code;
        this.safeNextAction = safeNextAction;
        this.requestId = requestId;
        this.name = "AdminWorkflowError";
    }
}
export class CustdRequestError extends Error {
    constructor(status, code, retryability, nextAction, problem, options) {
        super(`custd: request failed [code=${code}]`);
        this.status = status;
        this.code = code;
        this.retryability = retryability;
        this.nextAction = nextAction;
        this.problem = problem;
        this.name = "CustdRequestError";
        this.cause = options?.cause;
        this.requestId = options?.requestId ?? problem?.traceId ?? "";
    }
    get unavailable() {
        return (this.code === "oauth_unavailable" ||
            this.status === null ||
            this.status === 429 ||
            (this.status !== null && this.status >= 500));
    }
}
/**
 * CustdRawAcceptanceUnknownError reports that a raw upload's acceptance could
 * not be determined: the connection failed before a response arrived, the 202
 * acceptance body was missing or malformed, or the response carried a status
 * that does not prove rejection. The request may or may not have landed, so
 * this error carries no retry guidance (`retryability` "none", `nextAction`
 * "escalate"): there is no verified occurrence identity, and replaying the POST
 * could double-land accepted records. The cause never carries the request
 * payload or a token.
 */
export class CustdRawAcceptanceUnknownError extends Error {
    constructor(options) {
        super("custd: raw upload acceptance is unknown; the request may or may not have landed and must not be replayed");
        this.name = "CustdRawAcceptanceUnknownError";
        this.retryability = "none";
        this.nextAction = { action: "escalate" };
        this.cause = options?.cause;
        this.operationKey = options?.operationKey;
    }
}
/** A 404 on schema audit: the named tenant does not exist. */
export const SCHEMA_AUDIT_TENANT_NOT_FOUND_CODE = "schema_audit_tenant_not_found";
/** A 400 on schema audit: the request names no tenantSlug. */
export const SCHEMA_AUDIT_TENANT_SLUG_REQUIRED_CODE = "schema_audit_tenant_slug_required";
function publicAdminSite(site) {
    const { writeKey: _writeKey, ...safeSite } = site;
    return {
        ...safeSite,
        allowedOrigins: site.allowedOrigins ?? [],
        allowedEnvironments: site.allowedEnvironments ?? [],
    };
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
export * from "./app-messages.js";
export class CustdClient {
    constructor(config) {
        this.queue = [];
        this.onlineHandler = null;
        this.batchTimer = null;
        this.removeFlushTriggers = [];
        this.oauthToken = null;
        this.config = config;
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        const fetchImpl = config.fetch ?? globalThis.fetch;
        this.fetchImpl = (input, init) => fetchImpl(input, init);
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
        // The SDK's own identity is authoritative: a caller may add default
        // headers, but cannot accidentally drop the release Custd records.
        this.defaultHeaders = { ...(config.defaultHeaders ?? {}), "X-Custd-Sdk": SDK_IDENTITY };
        this.actingCompanySlug = config.actingCompanySlug?.trim() ?? "";
        this.retry = normalizeRetryOptions(config.retry);
        this.batch = config.batch;
        this.queueEnabled = config.queue?.enabled ?? config.batch != null;
        this.queueStorage = config.queue?.storage ?? new MemoryQueueStorage();
        this.maxQueueSize = config.queue?.maxQueueSize ?? 1000;
        this.flushOnOnline = config.queue?.flushOnOnline ?? true;
        this.compressionEnabled = config.compression?.enabled ?? true;
        this.compressionThresholdBytes = config.compression?.thresholdBytes ?? 1024;
        this.admin = new AdminNamespace((method, path, body, options) => this.adminRequest(method, path, body, options), (method, path, body, options) => this.apiRequest(method, path, body, options), (path, options) => this.offboardingDownload(path, options), (path, options) => this.auditExportDownload(path, options));
        this.provisioning = new ProvisioningNamespace((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.reporting = new ReportingNamespace((method, path, body, options) => this.apiRequest(method, path, body, options), (path, options) => this.apiDownload(path, options));
        this.storefronts = new StorefrontClient((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.schemas = new SchemaNamespace((method, path, body) => this.apiRequest(method, path, body));
        this.analytics = new AnalyticsEventClient((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.appMessages = new AppMessageClient((method, path, body, options, headers) => this.apiRequest(method, path, body, options, headers), async (path, options) => {
            const response = await this.apiDownloadResponse(path, options);
            if (options?.metadata)
                options.metadata.requestId = response.headers.get(REQUEST_ID_HEADER) ?? "";
            if (!response.ok)
                throw await responseRequestError(response, "request_failed");
            return response;
        });
        this.parsers = new ParserClient((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.measurement = new MeasurementClient((method, path, body, options) => this.apiRequest(method, path, body, options));
        this.ingestOperations = new IngestOperationsClient((method, path, body, options, headers) => this.apiRequest(method, path, body, options, headers), this.actingCompanySlug);
        this.publicReads = new PublicReadClient((path, headers, options) => this.publicRead(path, headers, options), (path, body, options) => this.publicWrite(path, body, options));
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
        if (config.audience) {
            body.set("audience", config.audience);
        }
        if (config.scopes && config.scopes.length > 0) {
            body.set("scope", config.scopes.join(" "));
        }
        let response;
        try {
            response = await this.fetchImpl(config.tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: basicAuthorization(config.clientId, config.clientSecret),
                },
                body,
                signal: options?.signal,
            });
            if (!response.ok) {
                const requestError = await responseRequestError(response, "oauth_unavailable");
                if (requestError.code !== "oauth_unavailable") {
                    throw new CustdRequestError(requestError.status, "oauth_unavailable", requestError.retryability, requestError.nextAction, requestError.problem);
                }
                throw requestError;
            }
            const token = (await response.json());
            if (typeof token?.access_token !== "string" || token.access_token.trim() === "") {
                throw new Error("custd: token response missing access_token");
            }
            this.oauthToken = {
                value: token.access_token,
                expiresAtMs: now + Math.max(0, token.expires_in ?? 300) * 1000,
            };
            return token.access_token;
        }
        catch (error) {
            if (error instanceof CustdRequestError)
                throw error;
            if (error instanceof Error && error.name === "AbortError")
                throw error;
            throw new CustdRequestError(response?.status ?? null, "oauth_unavailable", "bounded", { action: "retry", maxRetries: 1 }, undefined, { cause: error });
        }
    }
    async ingestEvent(event) {
        const prepared = prepareEvent(event);
        validateEvent(prepared);
        return this.sendWithRetry(prepared);
    }
    async track(event) {
        const prepared = prepareEvent(event);
        validateEvent(prepared);
        applyEnvironmentLabel(prepared, this.config.environment);
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
    /**
     * Upload raw, line-delimited content for the bound parser.
     *
     * X-Parser-UUID binds the parser exactly as direct collectors do. When
     * `target` is supplied its paired subClient/resource codes are appended as
     * query parameters: a declarative default the backend applies to records with
     * no canonical selection and refuses to let override an explicit selection.
     *
     * The route answers 202 Accepted, so the status alone is not success. Read
     * `processed` and `failed` on the returned result.
     *
     * A transport failure or an unusable acceptance body cannot prove whether the
     * upload landed, so it throws {@link CustdRawAcceptanceUnknownError} — which
     * carries no retry guidance — rather than a retryable transport error.
     * Replaying the POST could double-land accepted records; the SDK never retries
     * this operation automatically.
     */
    async ingestRawLines(request, options) {
        const parserUuid = assertRawParserUuid(request.parserUuid);
        const params = new URLSearchParams();
        if (request.target !== undefined) {
            assertRawSourceTarget(request.target);
            params.set("subClient", request.target.subClient);
            params.set("resource", request.target.resource);
        }
        const query = params.size > 0 ? `?${params.toString()}` : "";
        const token = await this.getToken(options);
        const headers = {
            ...this.defaultHeaders,
            "Content-Type": "text/plain; charset=utf-8",
            Authorization: `Bearer ${token}`,
            "X-Parser-UUID": parserUuid,
        };
        const operationKey = request.idempotencyKey;
        if (operationKey !== undefined && operationKey !== "") {
            headers["Idempotency-Key"] = operationKey;
        }
        let response;
        try {
            response = await this.fetchImpl(`${this.baseUrl}/api/v1/raw${query}`, {
                method: "POST",
                headers,
                body: request.content,
                signal: options?.signal,
            });
        }
        catch (error) {
            // A disconnect cannot prove whether the upload landed; offer no retry.
            throw new CustdRawAcceptanceUnknownError({ cause: error, operationKey });
        }
        if (!response.ok) {
            if (this.retry.retryOnStatuses.includes(response.status)) {
                throw new CustdRawAcceptanceUnknownError({ operationKey });
            }
            throw await problemError(response, `custd: raw ingest failed with status ${response.status}`);
        }
        let value;
        try {
            value = await response.json();
        }
        catch (error) {
            throw new CustdRawAcceptanceUnknownError({ cause: error, operationKey });
        }
        return validateRawIngestResult(value, operationKey);
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
    async adminRequest(method, path, body, options) {
        return this.apiRequest(method, `/admin${this.actingCompanyPath(path)}`, body, options);
    }
    // actingCompanyPath names the configured acting company in the `companySlug` query
    // the admin routes read, keeping a selector the call already set.
    actingCompanyPath(path) {
        if (this.actingCompanySlug === "") {
            return path;
        }
        const [route, query = ""] = path.split("?", 2);
        const params = new URLSearchParams(query);
        if (params.get("companySlug")) {
            return path;
        }
        params.set("companySlug", this.actingCompanySlug);
        return `${route}?${params.toString()}`;
    }
    async adminDownload(path, operation, options) {
        const token = await this.getToken(options);
        const response = await this.fetchImpl(`${this.baseUrl}/api/v1/admin${this.actingCompanyPath(path)}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, ...this.defaultHeaders },
            signal: options?.signal,
        });
        if (!response.ok) {
            throw new Error(`custd: ${operation} failed with status ${response.status}`);
        }
        return response;
    }
    async offboardingDownload(path, options) {
        const response = await this.adminDownload(path, "offboarding download", options);
        const lengthHeader = response.headers.get("content-length")?.trim() ?? "";
        const byteSize = Number(lengthHeader);
        const checksumSha256 = (response.headers.get("x-checksum-sha256") ?? "").trim().toLowerCase();
        if (!/^\d+$/.test(lengthHeader) || !Number.isSafeInteger(byteSize)) {
            await response.body?.cancel();
            throw new Error("custd: offboarding download content length is invalid");
        }
        if (!/^[a-f0-9]{64}$/.test(checksumSha256)) {
            await response.body?.cancel();
            throw new Error("custd: offboarding download checksum header is invalid");
        }
        return { ...responseDownloadStream(response, "offboarding download", byteSize), byteSize, checksumSha256 };
    }
    async auditExportDownload(path, options) {
        return responseDownloadStream(await this.adminDownload(path, "audit export", options), "audit export");
    }
    async apiRequest(method, path, body, options, headers) {
        const token = await this.getToken(options);
        let response;
        try {
            response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
                method,
                headers: {
                    ...requestContentType(body),
                    Authorization: `Bearer ${token}`,
                    ...this.defaultHeaders,
                    ...headers,
                    ...(options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
                    ...(options?.owningUserUuid ? { "X-Custd-Owning-User-UUID": options.owningUserUuid } : {}),
                },
                body: requestBody(body),
                signal: options?.signal,
            });
        }
        catch (error) {
            throw transportRequestError(error);
        }
        const requestId = response.headers.get(REQUEST_ID_HEADER) ?? "";
        if (options?.metadata)
            options.metadata.requestId = requestId;
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errorCode = "";
            let flatRequestId = "";
            let detail = "";
            let safeNextAction = "";
            let workflowEnvelope = false;
            if (text.length > 0) {
                try {
                    const parsed = JSON.parse(text);
                    errorCode = parsed.code || "";
                    flatRequestId = parsed.requestId || "";
                    detail = parsed.detail || parsed.error || parsed.message || parsed.title || "";
                    safeNextAction = parsed.safeNextAction || parsed.safe_next_action || "";
                    workflowEnvelope = typeof parsed.error === "string" && (errorCode.length > 0 || safeNextAction.length > 0);
                }
                catch {
                    detail = text.slice(0, 200);
                }
            }
            let message = detail.length > 0
                ? `custd: ${detail} (status ${response.status})`
                : `custd: request failed with status ${response.status}`;
            if (errorCode.length > 0) {
                message = `${message} [error=${errorCode}]`;
            }
            if (safeNextAction.length > 0) {
                message = `${message} [safeNextAction=${safeNextAction}]`;
            }
            if (workflowEnvelope) {
                throw new AdminWorkflowError(response.status, detail, errorCode, safeNextAction, requestId || flatRequestId);
            }
            throw await responseRequestError(response, errorCode || "request_failed", message, text);
        }
        if (response.status === 204) {
            return undefined;
        }
        return emptyApiNullLists(method, `/api/v1${path}`, (await response.json()));
    }
    // publicRead issues a GET that carries none of the client's own credentials.
    async publicRead(path, headers, options) {
        let response;
        try {
            response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
                method: "GET",
                headers: { ...headers, "X-Custd-Sdk": SDK_IDENTITY },
                signal: options?.signal,
            });
        }
        catch (error) {
            throw transportRequestError(error);
        }
        if (!response.ok)
            throw await responseRequestError(response, "request_failed");
        return emptyApiNullLists("GET", `/api/v1${path}`, (await response.json()));
    }
    /**
     * Opens a data-space owner's AI settings session from a handoff, on the broker's hub server.
     * hubOrigin is the broker's registered hub origin; the session never sends this client's credential.
     */
    redeemSiteAIOwnerHandoff(handoff, hubOrigin, options) {
        const failure = (response) => responseRequestError(response, "request_failed");
        return redeemSiteAIOwnerHandoff({ fetch: this.fetchImpl, failure }, handoff, hubOrigin, options);
    }
    // publicWrite posts JSON that carries none of the client's own credentials and expects no body back.
    async publicWrite(path, body, options) {
        let response;
        try {
            response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Custd-Sdk": SDK_IDENTITY },
                body: JSON.stringify(body),
                signal: options?.signal,
            });
        }
        catch (error) {
            throw transportRequestError(error);
        }
        if (!response.ok)
            throw await responseRequestError(response, "request_failed");
    }
    async apiDownloadResponse(path, options) {
        const token = await this.getToken(options);
        try {
            return await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}`, ...this.defaultHeaders },
                signal: options?.signal,
            });
        }
        catch (error) {
            throw transportRequestError(error);
        }
    }
    async apiDownload(path, options) {
        const response = await this.apiDownloadResponse(path, options);
        if (!response.ok)
            throw new Error(`custd: report export download failed with status ${response.status}`);
        const declared = Number(response.headers.get("content-length") ?? "0");
        if (declared > 64 * 1024 * 1024)
            throw new Error("custd: report export download exceeds 64 MiB");
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength > 64 * 1024 * 1024)
            throw new Error("custd: report export download exceeds 64 MiB");
        return bytes;
    }
}
// A byte body is a file upload sent as raw bytes, a form is a multipart upload whose boundary fetch
// sets, and every other body is JSON.
function requestContentType(body) {
    if (body instanceof FormData)
        return {};
    return { "Content-Type": body instanceof Uint8Array ? "application/octet-stream" : "application/json" };
}
function requestBody(body) {
    if (body === undefined)
        return undefined;
    if (body instanceof FormData)
        return body;
    if (body instanceof Uint8Array)
        return Uint8Array.from(body);
    return JSON.stringify(body);
}
class ReportingNamespace {
    constructor(request, download) {
        this.request = request;
        this.download = download;
    }
    createExport(input, options) {
        if (!input.dashboardKey || input.formats.length < 1 || input.formats.length > 8)
            throw new Error("custd: report export requires a dashboard key and 1 to 8 formats");
        return this.request("POST", "/reporting/exports", input, options);
    }
    async listExports(limit = 50, options) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100)
            throw new Error("custd: report export limit must be between 1 and 100");
        const list = await this.request("GET", `/reporting/exports?limit=${limit}`, undefined, options);
        return { exports: list.exports ?? [] };
    }
    getExport(exportId, options) {
        assertUuid(exportId, "exportId");
        return this.request("GET", `/reporting/exports/${encodeURIComponent(exportId)}`, undefined, options);
    }
    cancelExport(exportId, reason = "", options) {
        assertUuid(exportId, "exportId");
        return this.request("POST", `/reporting/exports/${encodeURIComponent(exportId)}/cancel`, { reason }, options);
    }
    downloadExport(exportId, artifactId, options) {
        assertUuid(exportId, "exportId");
        assertUuid(artifactId, "artifactId");
        return this.download(`/reporting/exports/${encodeURIComponent(exportId)}/artifacts/${encodeURIComponent(artifactId)}`, options);
    }
    /** Exports a completed time-plan run's frozen report source in one to eight formats. */
    async createCompletedRunExport(input, options) {
        if (input.formats.length < 1 || input.formats.length > 8)
            throw new Error("custd: completed run export requires 1 to 8 formats");
        const job = await this.request("POST", "/reporting/exports/completed-run", input, options);
        return { ...job, formats: job.formats ?? [] };
    }
    /** Lists the dashboards the tenant can open. */
    async dashboards(options) {
        const response = await this.request("GET", "/reporting/dashboards", undefined, options);
        return {
            dashboards: (response.dashboards ?? []).map((entry) => ({
                ...entry,
                interactions: entry.interactions ?? [],
                exportFormats: entry.exportFormats ?? [],
            })),
        };
    }
    /** Starts, or returns, the data generation that backs one dashboard view. */
    async generateDashboardData(input, options) {
        const generation = await this.request("POST", "/reporting/dashboard-data-generations", input, options);
        return {
            ...generation,
            datasetRowCounts: generation.datasetRowCounts ?? [],
            datasetSchemas: (generation.datasetSchemas ?? []).map((schema) => ({ ...schema, columns: schema.columns ?? [] })),
        };
    }
    /** Renders one query against a pack definition that is not published. */
    async previewDraft(input, options) {
        const data = await this.request("POST", "/reporting/draft-preview", input, options);
        emptyNullBuckets(data);
        if (!isRenderedWidgetData(data)) {
            throw new Error("custd: invalid reporting draft preview response");
        }
        return data;
    }
    dashboard(key, options) {
        return this.request("GET", `/reporting/dashboards/${encodeURIComponent(key)}`, undefined, options);
    }
    receipt(receiptUuid, options) {
        assertUuid(receiptUuid, "receiptUuid");
        return this.request("GET", `/processing/${encodeURIComponent(receiptUuid)}`, undefined, options);
    }
    outputs(options) {
        return this.request("GET", "/reporting/outputs", undefined, options);
    }
    output(outputUuid, options) {
        assertUuid(outputUuid, "outputUuid");
        return this.request("GET", `/reporting/outputs/${encodeURIComponent(outputUuid)}`, undefined, options);
    }
    queryOutput(outputUuid, request, options) {
        assertUuid(outputUuid, "outputUuid");
        return this.request("POST", `/reporting/outputs/${encodeURIComponent(outputUuid)}/query`, request, options);
    }
    async query(request, options) {
        const data = await this.request("POST", "/reporting/query", request, options);
        emptyNullBuckets(data);
        if (!isRenderedWidgetData(data)) {
            throw new Error("custd: invalid reporting query response");
        }
        if (data.trust && containsForbiddenReportingTrustKey(data.trust)) {
            throw new Error("custd: unsafe reporting trust diagnostics");
        }
        return data;
    }
    async subjectInsight(request, options) {
        if (!isValidSubjectInsightRequest(request)) {
            throw new Error("custd: invalid subject insight request");
        }
        const response = await this.request("POST", "/reporting/insights/subject", request, options);
        if (isRecord(response))
            emptyNullBuckets(response.data);
        if (!isSubjectInsightResponse(response)) {
            throw new Error("custd: invalid subject insight response");
        }
        if (response.data.trust && containsForbiddenReportingTrustKey(response.data.trust)) {
            throw new Error("custd: unsafe reporting trust diagnostics");
        }
        return response;
    }
}
function assertUuid(value, field) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new Error(`custd: ${field} must be a UUID`);
    }
}
function isValidSubjectInsightRequest(request) {
    const allowedKeys = new Set(["template", "subject", "from", "to", "rangeDays"]);
    if (!request ||
        !isRecord(request) ||
        Object.keys(request).some((key) => !allowedKeys.has(key)) ||
        typeof request.template !== "string" ||
        !/^[a-z][a-z0-9_]{0,127}$/.test(request.template) ||
        typeof request.subject !== "string" ||
        request.subject.trim() === "" ||
        request.subject.length > 512) {
        return false;
    }
    const hasRangeDays = request.rangeDays !== undefined;
    const hasFrom = request.from !== undefined;
    const hasTo = request.to !== undefined;
    if (hasRangeDays === (hasFrom || hasTo))
        return false;
    if (request.rangeDays !== undefined) {
        return Number.isInteger(request.rangeDays) && request.rangeDays >= 1 && request.rangeDays <= 366;
    }
    if (typeof request.from !== "string" || typeof request.to !== "string")
        return false;
    if (!isValidRfc3339(request.from) || !isValidRfc3339(request.to))
        return false;
    const from = Date.parse(request.from);
    const to = Date.parse(request.to);
    return Number.isFinite(from) && Number.isFinite(to) && to > from && to - from <= 366 * 24 * 60 * 60 * 1000;
}
function isValidRfc3339(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
    if (!match)
        return false;
    const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
    const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
    return (month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= daysInMonth &&
        hour <= 23 &&
        minute <= 59 &&
        second <= 59 &&
        offsetHour <= 24 &&
        offsetMinute <= 59 &&
        (offsetHour !== 24 || offsetMinute === 0));
}
/** A JSON null bucket list decodes as empty. */
function emptyNullBuckets(value) {
    if (isRecord(value) && value.buckets === null)
        value.buckets = [];
}
function isSubjectInsightResponse(value) {
    if (!isRecord(value) || !isRenderedWidgetData(value.data))
        return false;
    return true;
}
function isRenderedWidgetData(value) {
    return (isRecord(value) &&
        Array.isArray(value.buckets) &&
        value.buckets.every(isRenderedWidgetBucket) &&
        isRenderedMetricValue(value.value) &&
        isInteger(value.queryDurationMs) &&
        isOptionalInteger(value.parquetUriCount) &&
        isInteger(value.snapshotAgeMs) &&
        isInteger(value.eventLagP95Ms) &&
        (value.metadata === undefined || isReportingQueryMetadata(value.metadata)) &&
        (value.sources === undefined || (Array.isArray(value.sources) && value.sources.every(isReportingSourceSummary))) &&
        isOptionalStringArray(value.warnings) &&
        (value.delta === undefined || isRenderedMetricValue(value.delta)) &&
        isOptionalFiniteNumber(value.deltaPercent) &&
        isOptionalString(value.deltaLabel) &&
        isOptionalString(value.secondaryLabel) &&
        (value.trust === undefined || isRenderedReportingTrust(value.trust)));
}
function isRenderedWidgetBucket(value) {
    return (isRecord(value) &&
        typeof value.date === "string" &&
        isRenderedMetricValue(value.value) &&
        typeof value.source === "string" &&
        isInteger(value.queryDurationMs) &&
        isOptionalInteger(value.parquetUriCount) &&
        isOptionalString(value.message) &&
        (value.secondary === undefined || isRenderedMetricValue(value.secondary)));
}
function isRenderedMetricValue(value) {
    return (isRecord(value) &&
        isFiniteNumber(value.value) &&
        typeof value.unit === "string" &&
        isInteger(value.sampleCount) &&
        typeof value.dataSufficiency === "string" &&
        typeof value.complete === "boolean" &&
        (value.truncated === undefined || typeof value.truncated === "boolean"));
}
function isReportingQueryMetadata(value) {
    return (isRecord(value) &&
        typeof value.resolvedTemplate === "string" &&
        isOptionalString(value.rangeStart) &&
        isOptionalString(value.rangeEnd) &&
        isInteger(value.effectiveMaxRows) &&
        isInteger(value.returnedRows) &&
        isInteger(value.returnedBuckets) &&
        isInteger(value.coveredWindows));
}
function isReportingSourceSummary(value) {
    return (isRecord(value) &&
        typeof value.kind === "string" &&
        isInteger(value.count) &&
        isOptionalString(value.coverageStart) &&
        isOptionalString(value.coverageEnd) &&
        typeof value.completeness === "string");
}
function isRenderedReportingTrust(value) {
    return (isRecord(value) &&
        typeof value.status === "string" &&
        typeof value.dataFreshness === "string" &&
        typeof value.retryability === "string" &&
        isReportingNextActionHint(value.nextAction) &&
        isOptionalString(value.lastExport) &&
        isOptionalString(value.schemaVersion) &&
        isOptionalString(value.contractVersion) &&
        typeof value.rollupState === "string" &&
        isOptionalStringArray(value.queryWarnings) &&
        typeof value.coverage === "string" &&
        isOptionalString(value.permissionClass) &&
        typeof value.captureState === "string" &&
        typeof value.consentState === "string" &&
        typeof value.exportState === "string" &&
        isOptionalString(value.partialReason) &&
        isOptionalString(value.unavailableReason));
}
function isReportingNextActionHint(value) {
    return (isRecord(value) &&
        typeof value.action === "string" &&
        isOptionalInteger(value.pollAfterSeconds) &&
        isOptionalInteger(value.maxRetries));
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function isInteger(value) {
    return typeof value === "number" && Number.isInteger(value);
}
function isOptionalFiniteNumber(value) {
    return value === undefined || isFiniteNumber(value);
}
function isOptionalInteger(value) {
    return value === undefined || isInteger(value);
}
function isOptionalString(value) {
    return value === undefined || typeof value === "string";
}
function isOptionalStringArray(value) {
    return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
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
    /** Lists the tenant's event types. */
    async list() {
        const eventTypes = await this.request("GET", schemaRegistryPath);
        return { eventTypes: eventTypes ?? [] };
    }
    /** Lists an event type's schema versions. */
    async listVersions(eventType) {
        const versions = await this.request("GET", `${eventSchemaPath(eventType)}/versions`);
        return { versions: versions ?? [] };
    }
    /** Returns one version's JSON Schema document. */
    async get(eventType, version) {
        return { schema: await this.request("GET", eventSchemaPath(eventType, version)) };
    }
    /** Stores a schema version, creating the event type when it is new, and returns the event type. */
    register(input) {
        return this.request("POST", schemaRegistryPath, input);
    }
    /** Makes one version the event type's active schema. */
    activate(eventType, version) {
        return this.request("POST", `${eventSchemaPath(eventType, version)}/active`);
    }
    /** Lets events validate against one version again. */
    enable(eventType, version) {
        return this.request("PUT", `${eventSchemaPath(eventType, version)}/enabled`);
    }
    /** Deprecates one version so new events no longer validate against it. */
    disable(eventType, version) {
        return this.request("DELETE", `${eventSchemaPath(eventType, version)}/enabled`);
    }
    /** Retires the tenant's event type. Its schemas and stored events stay readable. */
    disableEventType(eventType) {
        return this.request("DELETE", eventSchemaPath(eventType));
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
    constructor(request, nonAdminRequest, offboardingDownload, auditExportDownload) {
        this.dataLabels = new DataLabelAdminClient(request);
        this.dataScopes = new DataScopeAdminClient(request);
        this.tenants = new AdminTenantNamespace(request);
        this.lifecycle = new BackendLifecycleClient(request, offboardingDownload);
        this.clientSetup = new ClientSetupClient(request);
        this.oauthClients = new AdminOAuthClientNamespace(request);
        this.sites = new AdminSiteNamespace(request);
        this.siteDomains = new SiteDomainAdminClient(nonAdminRequest);
        this.siteInsights = new SiteInsightsAdminClient(request);
        this.schemas = new AdminSchemaNamespace(request);
        this.measurement = new AdminMeasurementNamespace(request);
        this.predictions = new PredictionAdminClient(request);
        this.privacy = new AdminPrivacyNamespace(request);
        this.retention = new RetentionClient(request);
        this.storageAlerts = new AdminStorageAlertsNamespace(request);
        this.audit = new AdminAuditNamespace(request, auditExportDownload);
        this.offboarding = new OffboardingClient(request, offboardingDownload);
        this.reportingPacks = new AdminReportingPacksNamespace(request);
        this.tenantStorage = new TenantStorageClient(nonAdminRequest);
        this.subjectExports = new SubjectExportClient(request);
        this.privacyErasures = new PrivacyErasureClient(request);
        this.timePlans = new TimePlanAdminClient(request);
        this.usage = new UsageAdminClient(request);
        this.authProjects = new AuthProjectAdminClient(request);
        this.workflowTimings = new WorkflowTimingAdminClient(request);
        this.users = new AdminUserAdminClient(request);
        this.uncertaintyModels = new UncertaintyModelAdminClient(request);
        this.impersonation = new ImpersonationAdminClient(request);
        this.supportAccess = new SupportAccessAdminClient(request);
        this.system = new SystemAdminClient(request);
        this.environmentPolicy = new EnvironmentPolicyAdminClient(request);
        this.machineAccess = new MachineAccessAdminClient(request);
        this.rls = new RlsAdminClient(request);
        this.oauthClientAdmissions = new OAuthClientAdmissionAdminClient(request);
        this.sdkUsage = new SdkUsageAdminClient(request);
        this.ingestClaims = new IngestClaimAdminClient(request);
        this.accountingEvidence = new AccountingEvidenceAdminClient(request);
        this.webhooks = new NotificationWebhookAdminClient(request);
        this.notificationDestinations = new NotificationDestinationAdminClient(nonAdminRequest);
        this.emailRelay = new EmailRelayAdminClient(request);
        this.campaignEmail = new CampaignEmailAdminClient(request);
        this.eventTypes = new EventTypeAdminClient(request);
        this.errorIssues = new ErrorIssueAdminClient(nonAdminRequest);
        this.managedAudit = new ManagedAuditAdminClient(nonAdminRequest);
    }
}
class ProvisioningNamespace {
    constructor(request) {
        this.dataSpaces = new ProvisioningDataSpaceNamespace(request);
        this.producers = new ProvisioningProducerNamespace(request);
        this.reservations = new ProvisioningReservationsNamespace(request);
    }
}
/** Producer reservations under one data space. A system administrator names the parent tenant. */
class ProvisioningReservationsNamespace {
    constructor(request) {
        this.request = request;
    }
    reserve(dataSpaceSlug, body, parentCompanySlug) {
        return this.request("POST", reservationsPath(dataSpaceSlug, "", parentCompanySlug), body);
    }
    list(dataSpaceSlug, parentCompanySlug) {
        return this.request("GET", reservationsPath(dataSpaceSlug, "", parentCompanySlug));
    }
    claim(dataSpaceSlug, producerSlug, body, parentCompanySlug) {
        return this.request("POST", reservationsPath(dataSpaceSlug, `/${encodeURIComponent(producerSlug)}/claim`, parentCompanySlug), body);
    }
    release(dataSpaceSlug, producerSlug, parentCompanySlug) {
        return this.request("DELETE", reservationsPath(dataSpaceSlug, `/${encodeURIComponent(producerSlug)}`, parentCompanySlug));
    }
}
function reservationsPath(dataSpaceSlug, suffix, parentCompanySlug) {
    return `/data-spaces/${encodeURIComponent(dataSpaceSlug)}/producer-reservations${suffix}${parentQuery(parentCompanySlug)}`;
}
class ProvisioningDataSpaceNamespace {
    constructor(request) {
        this.request = request;
    }
    /** Creates a data space under the caller's company; a system administrator names the parent tenant. */
    create(dataSpace, parentCompanySlug) {
        return this.request("POST", `/data-spaces${parentQuery(parentCompanySlug)}`, dataSpace);
    }
    /** Lists the caller's data spaces; a system administrator names the parent tenant. */
    list(parentCompanySlug) {
        return this.request("GET", `/data-spaces${parentQuery(parentCompanySlug)}`);
    }
    /** Reads retained storage per data space. A system administrator names the parent tenant. */
    async usage(parentCompanySlug) {
        const summary = await this.request("GET", `/data-spaces/usage${parentQuery(parentCompanySlug)}`);
        return { ...summary, dataSpaces: summary.dataSpaces ?? [] };
    }
    revoke(slug, parentCompanySlug) {
        return this.request("DELETE", `/data-spaces/${encodeURIComponent(slug)}${parentQuery(parentCompanySlug)}`);
    }
    /** Asks Custd to erase everything a data space holds. The answer is the accepted request, not the finished erasure. */
    erase(slug, parentCompanySlug) {
        return this.request("POST", `/data-spaces/${encodeURIComponent(slug)}/erasure${parentQuery(parentCompanySlug)}`);
    }
    getErasure(slug, parentCompanySlug) {
        return this.request("GET", `/data-spaces/${encodeURIComponent(slug)}/erasure${parentQuery(parentCompanySlug)}`);
    }
    /** Reads whether a data space's signing producers are ready and what ingest refused. */
    async getSigningStatus(slug, parentCompanySlug) {
        const path = `/data-spaces/${encodeURIComponent(slug)}/signing-status${parentQuery(parentCompanySlug)}`;
        const status = await this.request("GET", path);
        return {
            ...status,
            producers: (status.producers ?? []).map((producer) => ({
                ...producer,
                keyFingerprints: producer.keyFingerprints ?? [],
            })),
        };
    }
    /**
     * Moves a parent's Site, with every record keyed to it, into the data space. Its credentials keep their
     * client id and secret. Repeating it answers `already_adopted`.
     */
    async adoptSite(slug, siteUuid, parentCompanySlug) {
        const path = `/data-spaces/${encodeURIComponent(slug)}/sites/${encodeURIComponent(siteUuid)}/adopt${parentQuery(parentCompanySlug)}`;
        const adoption = await this.request("POST", path);
        return { ...adoption, credentialClientIds: adoption.credentialClientIds ?? [] };
    }
}
function parentQuery(parentCompanySlug) {
    return parentCompanySlug ? `?${new URLSearchParams({ parentCompanySlug })}` : "";
}
function provisionedProducer(credentials) {
    return {
        ...credentials,
        scopes: credentials.scopes ?? [],
        allowedEnvironments: credentials.allowedEnvironments ?? [],
    };
}
class ProvisioningProducerNamespace {
    constructor(request) {
        this.request = request;
    }
    async provision(request) {
        return provisionedProducer(await this.request("POST", "/producer-provisioning", request));
    }
    async list(companySlug) {
        const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
        const response = await this.request("GET", `/producer-provisioning${query}`);
        return { producers: (response.producers ?? []).map(publicProducer) };
    }
    async get(clientId) {
        return publicProducer(await this.request("GET", `/producer-provisioning/${encodeURIComponent(clientId)}`));
    }
    rotateSecret(clientId) {
        return this.request("POST", `/producer-provisioning/${encodeURIComponent(clientId)}/rotate-secret`);
    }
    /**
     * Sets the environment recorded for this producer. It is the authenticated
     * default for events that do not declare their own, not a per-environment
     * credential: one producer is expected to carry every environment unless an
     * operator deliberately restricts it.
     */
    async updateEnvironment(clientId, environment) {
        const path = `/producer-provisioning/${encodeURIComponent(clientId)}/environment`;
        return publicProducer(await this.request("PATCH", path, { environment }));
    }
    /** Replaces the public keys a producer minted with the hosting-email-delivery template signs with. */
    async setSigningKeys(clientId, update) {
        const path = `/producer-provisioning/${encodeURIComponent(clientId)}/signing-keys`;
        return signingKeys(await this.request("PUT", path, update));
    }
    /** Reads the public keys, and their fingerprints, a signing producer's events are verified with. */
    async getSigningKeys(clientId) {
        const path = `/producer-provisioning/${encodeURIComponent(clientId)}/signing-keys`;
        return signingKeys(await this.request("GET", path));
    }
    revoke(clientId) {
        return this.request("DELETE", `/producer-provisioning/${encodeURIComponent(clientId)}`);
    }
}
function signingKeys(keys) {
    return { ...keys, publicKeys: keys.publicKeys ?? [], keyFingerprints: keys.keyFingerprints ?? [] };
}
function publicProducer(producer) {
    return { ...producer, scopes: producer.scopes ?? [], allowedEnvironments: producer.allowedEnvironments ?? [] };
}
function historicalCleanupReceipt(wire) {
    return {
        companyId: wire.company_id,
        requestedByKind: wire.requested_by_kind,
        requestedAt: wire.requested_at,
        completedAt: wire.completed_at,
        finalState: wire.final_state,
        perStore: (wire.per_store ?? []).map((store) => ({
            store: store.store,
            retentionClass: store.retention_class,
            deletedCount: store.deleted_count,
            retainedExceptionsCount: store.retained_exceptions_count,
        })),
        ...(wire.waiver ? { waiver: wire.waiver } : {}),
        sha256: wire.sha256,
    };
}
function tenantCompanyPath(slug, action, companyId) {
    if (!Number.isInteger(companyId) || companyId <= 0) {
        throw new Error("custd: company id must be a positive integer");
    }
    return `/tenants/${encodeURIComponent(slug)}/${action}?companyId=${companyId}`;
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
    /**
     * Permanently removes an already deleted tenant once its cleanup is finished.
     * The server refuses an unready tenant with a conflict.
     */
    finalize(slug, companyId) {
        return this.request("POST", tenantCompanyPath(slug, "finalize", companyId));
    }
    /**
     * Runs the credential-revoking, queue, database and object-storage cleanup for a
     * deleted tenant. The idempotencyKey is required: repeat it to retry the same cleanup.
     */
    async historicalCleanup(slug, companyId, options = {}) {
        const path = tenantCompanyPath(slug, "historical-cleanup", companyId);
        if (!options.idempotencyKey?.trim()) {
            throw new Error("custd: historical cleanup idempotency key is required");
        }
        const wire = await this.request("POST", path, undefined, options);
        return historicalCleanupReceipt(wire);
    }
    getDataSpaceEntitlement(slug) {
        return this.request("GET", `/tenants/${encodeURIComponent(slug)}/data-space-entitlement`);
    }
    updateDataSpaceEntitlement(slug, body) {
        return this.request("PUT", `/tenants/${encodeURIComponent(slug)}/data-space-entitlement`, body);
    }
    updateStorageLimit(slug, body) {
        return this.request("PUT", `/tenants/${encodeURIComponent(slug)}/storage-limit`, body);
    }
}
// Custd requires a canonical UUIDv7 Idempotency-Key on every OAuth client
// mutation, so one is generated when the caller does not supply it. A caller that
// retries the same mutation should pass its own key to reuse it; a caller that
// checks for an existing client first, as a reconcile does, is safe either way.
class AdminOAuthClientNamespace {
    constructor(request) {
        this.request = request;
    }
    async create(client, options = {}) {
        const created = await this.request("POST", "/oauth-clients", client, mutationOptions(options));
        const { loginSetup } = created;
        return {
            ...created,
            scopes: created.scopes ?? [],
            ...(loginSetup
                ? {
                    loginSetup: { ...loginSetup, scopes: loginSetup.scopes ?? [], redirectUris: loginSetup.redirectUris ?? [] },
                }
                : {}),
        };
    }
    list() {
        return this.request("GET", "/oauth-clients");
    }
    get(clientId) {
        return this.request("GET", `/oauth-clients/${encodeURIComponent(clientId)}`);
    }
    delete(clientId, options = {}) {
        return this.request("DELETE", `/oauth-clients/${encodeURIComponent(clientId)}`, undefined, mutationOptions(options));
    }
    rotateSecret(clientId, options = {}) {
        return this.request("POST", `/oauth-clients/${encodeURIComponent(clientId)}/rotate-secret`, undefined, mutationOptions(options));
    }
    /**
     * Issues a new secret for a client whose current secret nobody holds. The new secret is shown only
     * in this response.
     */
    replaceUnknownSecret(clientId, options = {}) {
        return this.request("POST", `/oauth-clients/${encodeURIComponent(clientId)}/replace-unknown-secret`, undefined, mutationOptions(options));
    }
    updateScopes(clientId, body, options = {}) {
        return this.request("PATCH", `/oauth-clients/${encodeURIComponent(clientId)}/scopes`, body, mutationOptions(options));
    }
}
function mutationOptions(options) {
    return { ...options, idempotencyKey: options.idempotencyKey ?? uuidv7() };
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
        return { sites: (response.sites ?? []).map(publicAdminSite) };
    }
    async get(siteUuid) {
        const site = await this.request("GET", `/sites/${encodeURIComponent(siteUuid)}`);
        return publicAdminSite(site);
    }
    async update(siteUuid, body) {
        const site = await this.request("PATCH", `/sites/${encodeURIComponent(siteUuid)}`, body);
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
    validate(body) {
        return this.request("POST", "/schema/validate", body);
    }
    enableVersion(tenantSlug, eventTypeSlug, body) {
        return this.request("POST", `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/enable`, body);
    }
    register(tenantSlug, eventTypeSlug, body) {
        return this.request("POST", `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/register`, body);
    }
    dryRun(tenantSlug, eventTypeSlug, body) {
        return this.request("POST", `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/dry-run`, body);
    }
    async audit(tenantSlug) {
        const query = tenantSlug ? `?${new URLSearchParams({ tenantSlug })}` : "";
        const audit = await this.request("GET", `/schema/audit${query}`);
        return { ...audit, schemas: (audit.schemas ?? []).map(schemaAuditResult) };
    }
}
function schemaAuditResult(result) {
    const compile = (pass) => ({ ...pass, issues: pass.issues ?? [] });
    return {
        ...result,
        issueCodes: result.issueCodes ?? [],
        legacyCompile: compile(result.legacyCompile),
        sharedCompile: compile(result.sharedCompile),
        exampleValidation: { ...result.exampleValidation, issueCodes: result.exampleValidation.issueCodes ?? [] },
    };
}
function privacyRules(rules) {
    return { ...rules, rules: rules.rules ?? [] };
}
class AdminPrivacyNamespace {
    constructor(request) {
        this.request = request;
    }
    async getRules(companySlug) {
        const query = companySlug ? `?${new URLSearchParams({ companySlug })}` : "";
        return privacyRules(await this.request("GET", `/privacy/rules${query}`));
    }
    async setRules(body) {
        return privacyRules(await this.request("PUT", "/privacy/rules", body));
    }
    mapIdentifier(companySlug, body) {
        return this.request("POST", `/privacy/identifiers/${encodeURIComponent(companySlug)}/map`, body);
    }
    async listIdentifierMappings(companySlug) {
        const list = await this.request("GET", `/privacy/identifiers/${encodeURIComponent(companySlug)}`);
        return { ...list, mappings: list.mappings ?? [] };
    }
    async listConsent(subjectId, companySlug) {
        const params = new URLSearchParams({ subjectId });
        if (companySlug)
            params.set("companySlug", companySlug);
        const response = await this.request("GET", `/privacy/consent?${params}`);
        return { ...response, records: response.records ?? [] };
    }
    recordConsent(body) {
        return this.request("POST", "/privacy/consent", body);
    }
    revokeConsent(subjectId, revoke) {
        const params = new URLSearchParams({ purpose: revoke.purpose });
        if (revoke.source)
            params.set("source", revoke.source);
        if (revoke.companySlug)
            params.set("companySlug", revoke.companySlug);
        return this.request("DELETE", `/privacy/consent/${encodeURIComponent(subjectId)}?${params}`);
    }
}
class AdminStorageAlertsNamespace {
    constructor(request) {
        this.request = request;
    }
    listRules(tenantSlug) {
        return this.request("GET", `/storage/alerts/${encodeURIComponent(tenantSlug)}`);
    }
    createRule(tenantSlug, body) {
        return this.request("POST", `/storage/alerts/${encodeURIComponent(tenantSlug)}`, body);
    }
    deleteRule(tenantSlug, ruleId) {
        return this.request("DELETE", `/storage/alerts/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(ruleId)}`);
    }
    async listEvents(tenantSlug) {
        const response = await this.request("GET", `/storage/alerts/${encodeURIComponent(tenantSlug)}/events`);
        return { events: response.events ?? [] };
    }
}
const auditDisclosureStates = new Set(["available", "redacted", "not_recorded"]);
function mapAdminAuditChange(value) {
    if (!isRecord(value) || typeof value.field !== "string")
        return undefined;
    const change = { field: value.field };
    if ("before" in value)
        change.before = value.before;
    if ("after" in value)
        change.after = value.after;
    return change;
}
function mapAdminAuditNetwork(value) {
    if (!isRecord(value))
        return undefined;
    const ipAddressState = value.ipAddressState;
    const userAgentState = value.userAgentState;
    if (!auditDisclosureStates.has(ipAddressState) ||
        !auditDisclosureStates.has(userAgentState))
        return undefined;
    return {
        ...(typeof value.ipAddress === "string" ? { ipAddress: value.ipAddress } : {}),
        ipAddressState: ipAddressState,
        ...(typeof value.userAgent === "string" ? { userAgent: value.userAgent } : {}),
        userAgentState: userAgentState,
    };
}
function mapAdminAuditRetention(value) {
    if (!isRecord(value) ||
        typeof value.eventMaxAgeSeconds !== "number" ||
        typeof value.ipAddressMaxAgeSeconds !== "number" ||
        typeof value.userAgentMaxAgeSeconds !== "number")
        return undefined;
    return {
        eventMaxAgeSeconds: value.eventMaxAgeSeconds,
        ipAddressMaxAgeSeconds: value.ipAddressMaxAgeSeconds,
        userAgentMaxAgeSeconds: value.userAgentMaxAgeSeconds,
    };
}
function mapAdminAuditEvent(event) {
    if (typeof event.eventId !== "string" || !AUDIT_EVENT_UUID_PATTERN.test(event.eventId)) {
        throw new Error("custd: audit event response eventId must be a UUID");
    }
    const details = event.details;
    const actorRoles = Array.isArray(event.actorRoles)
        ? event.actorRoles.filter((role) => typeof role === "string")
        : [];
    const changes = Array.isArray(event.changes)
        ? event.changes.map(mapAdminAuditChange).filter((change) => change !== undefined)
        : [];
    const network = mapAdminAuditNetwork(event.network);
    return {
        eventId: event.eventId,
        tenantSlug: event.tenantSlug,
        actorKind: event.actorKind,
        ...(event.actorReference !== undefined ? { actorReference: event.actorReference } : {}),
        actorDisplayName: event.actorDisplayName,
        ...(actorRoles.length > 0 ? { actorRoles } : {}),
        action: event.action,
        resourceType: event.resourceType,
        ...(event.resourceId !== undefined ? { resourceId: event.resourceId } : {}),
        outcome: event.outcome,
        ...(event.correlationId !== undefined ? { correlationId: event.correlationId } : {}),
        ...(event.operationId !== undefined ? { operationId: event.operationId } : {}),
        ...(changes.length > 0 ? { changes } : {}),
        ...(details !== undefined && typeof details === "object" && !Array.isArray(details) ? { details } : {}),
        ...(network !== undefined ? { network } : {}),
        ...(event.domainHistory !== undefined ? { domainHistory: event.domainHistory } : {}),
        createdAt: event.createdAt,
    };
}
function mapAdminReportingPackAuditEvent(event) {
    return {
        action: event.action,
        ...(event.actorReference !== undefined ? { actorReference: event.actorReference } : {}),
        actorDisplayName: event.actorDisplayName,
        resourceType: event.resourceType,
        packKey: event.packKey,
        createdAt: event.createdAt,
    };
}
const AUDIT_EVENT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class AdminAuditNamespace {
    constructor(request, download) {
        this.request = request;
        this.download = download;
    }
    auditQuery(options, includePagination = true) {
        if (!options) {
            return "";
        }
        const params = new URLSearchParams();
        if (options.scope)
            params.set("scope", options.scope);
        if (options.companySlug)
            params.set("companySlug", options.companySlug);
        if (options.affectedTenantSlug)
            params.set("affectedTenantSlug", options.affectedTenantSlug);
        if (options.since)
            params.set("since", options.since);
        if (options.until)
            params.set("until", options.until);
        if (options.actorKind)
            params.set("actorKind", options.actorKind);
        if (options.actorReference)
            params.set("actorReference", options.actorReference);
        if (options.action)
            params.set("action", options.action);
        if (options.resourceType)
            params.set("resourceType", options.resourceType);
        if (options.resourceId)
            params.set("resourceId", options.resourceId);
        if (options.outcome)
            params.set("outcome", options.outcome);
        if (options.correlationId)
            params.set("correlationId", options.correlationId);
        if (options.environmentId)
            params.set("environmentId", options.environmentId);
        if (includePagination && typeof options.limit === "number")
            params.set("limit", String(options.limit));
        if (includePagination && options.cursor)
            params.set("cursor", options.cursor);
        const query = params.toString();
        return query.length === 0 ? "" : `?${query}`;
    }
    auditLookupQuery(options) {
        if (!options)
            return "";
        const params = new URLSearchParams();
        if (options.scope)
            params.set("scope", options.scope);
        if (options.companySlug)
            params.set("companySlug", options.companySlug);
        const query = params.toString();
        return query.length === 0 ? "" : `?${query}`;
    }
    async listEvents(options) {
        const response = await this.request("GET", `/audit/events${this.auditQuery(options)}`);
        const retention = mapAdminAuditRetention(response.retention);
        return {
            events: (response.events ?? []).map(mapAdminAuditEvent),
            nextCursor: response.nextCursor ?? {},
            ...(typeof response.coverageBeginsAt === "string" ? { coverageBeginsAt: response.coverageBeginsAt } : {}),
            ...(retention === undefined ? {} : { retention }),
        };
    }
    async getEvent(eventId, options) {
        const response = await this.request("GET", `/audit/events/${encodeURIComponent(eventId)}${this.auditLookupQuery(options)}`);
        return mapAdminAuditEvent(response);
    }
    exportEvents(options, format = "json") {
        if (format !== "csv" && format !== "json") {
            return Promise.reject(new Error("custd: audit export format must be csv or json"));
        }
        const query = this.auditQuery(options, false);
        const suffix = query.length > 0 ? `${query}&format=${format}` : `?format=${format}`;
        return this.download(`/audit/events/export${suffix}`);
    }
    async listReportingPackEvents(packKey) {
        const response = await this.request("GET", `/reporting-packs/audit-events?packKey=${encodeURIComponent(packKey)}`);
        return { events: (response.events ?? []).map(mapAdminReportingPackAuditEvent) };
    }
}
class AdminReportingPacksNamespace {
    constructor(request) {
        this.request = request;
    }
    listDrafts() {
        return this.request("GET", "/reporting-packs/drafts");
    }
    /** List the reviewed setup templates (each with its canonical definition). */
    listSetupTemplates() {
        return this.request("GET", "/reporting-packs/setup-templates");
    }
    /**
     * Apply typed bindings to one reviewed setup template and return the
     * server-built definition. Pure build: the server creates no data, grants no
     * scope, and writes no generation; post the result through createDraft/preview
     * only when the caller intends to.
     */
    bindSetupTemplate(kind, body) {
        return this.request("POST", `/reporting-packs/setup-templates/${encodeURIComponent(kind)}/bind`, body);
    }
    getDraft(draftId) {
        return this.request("GET", `/reporting-packs/drafts/${encodeURIComponent(draftId)}`);
    }
    createDraft(body) {
        return this.request("POST", "/reporting-packs/drafts", body);
    }
    updateDraft(draftId, body) {
        return this.request("PUT", `/reporting-packs/drafts/${encodeURIComponent(draftId)}`, body);
    }
    validate(body) {
        return this.request("POST", "/reporting-packs/validate", body);
    }
    preview(body) {
        return this.request("POST", "/reporting-packs/preview", body);
    }
    publish(draftId) {
        return this.request("POST", `/reporting-packs/drafts/${encodeURIComponent(draftId)}/publish`);
    }
    restart(draftId) {
        return this.request("POST", `/reporting-packs/drafts/${encodeURIComponent(draftId)}/restart`);
    }
    getGeneration(generationId) {
        return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}`);
    }
    getGenerationStatus(generationId) {
        return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}/status`);
    }
    rollbackGeneration(generationId) {
        return this.request("POST", `/reporting-packs/generations/${encodeURIComponent(generationId)}/rollback`);
    }
    async listGenerationValidity() {
        const response = await this.request("GET", "/reporting-packs/generation-validity");
        return { generations: response.generations ?? [] };
    }
    getRollupProvenance(generationId) {
        return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}/rollup-provenance`);
    }
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
    validateEnvironmentValue(event.environment ?? "");
    validateProducerLabels(event);
}
const labelKeyPattern = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
/** Reserved envelope label carrying a declared environment. */
export const environmentLabelKey = "custd.environment";
const environmentValuePattern = /^[a-z][a-z0-9-]{0,31}$/;
/**
 * Checks a declared environment against the contract ingest applies, so a
 * rejected declaration fails locally instead of failing the event at the API.
 */
export function validateEnvironmentValue(value) {
    if (value === "")
        return;
    if (value !== value.trim() || !environmentValuePattern.test(value)) {
        throw new Error(`custd: environment ${JSON.stringify(value)} must be lowercase letters, digits and hyphens, at most 32 characters`);
    }
    if (value === "unclassified") {
        throw new Error('custd: environment "unclassified" is reserved');
    }
}
/**
 * Stamps the effective environment onto the envelope labels. An event-level
 * declaration wins over the client default, and a label the caller set is never
 * overwritten.
 */
export function applyEnvironmentLabel(event, clientEnvironment) {
    const effective = event.environment || clientEnvironment || "";
    if (effective === "")
        return;
    event.labels = { ...(event.labels ?? {}) };
    if (event.labels[environmentLabelKey] === undefined) {
        event.labels[environmentLabelKey] = effective;
    }
}
function validateProducerLabels(event) {
    if ("resolvedLabels" in event || "vocabularyFingerprint" in event) {
        throw new Error("custd: server-owned label fields are not accepted");
    }
    if (event.labels === undefined)
        return;
    if (event.labels === null || typeof event.labels !== "object" || Array.isArray(event.labels)) {
        throw new Error("custd: labels must be an object of strings");
    }
    const entries = Object.entries(event.labels);
    if (entries.length > 16)
        throw new Error("custd: labels may contain at most 16 entries");
    for (const [key, value] of entries) {
        if (!labelKeyPattern.test(key) || utf8Bytes(key) > 64 || key.startsWith("custd.")) {
            throw new Error(`custd: labels.${key} has an invalid key`);
        }
        if (typeof value !== "string" || value === "" || value !== value.trim() || utf8Bytes(value) > 128) {
            throw new Error(`custd: labels.${key} has an invalid value`);
        }
    }
}
function utf8Bytes(value) {
    return new TextEncoder().encode(value).length;
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
    validateEnvironmentValue(event.environment ?? "");
    validateProducerLabels(event);
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
const RAW_PARSER_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
// assertRawParserUuid rejects a missing or malformed parser UUID before a
// request is sent. It is a cheap shape check; the backend still verifies the
// parser exists and is enabled.
function assertRawParserUuid(value) {
    if (typeof value !== "string" || !RAW_PARSER_UUID_PATTERN.test(value)) {
        throw new RangeError("custd: raw ingest requires a parser UUID");
    }
    return value;
}
// assertRawSourceTarget rejects a partial or malformed target before a request
// is sent. Both codes must be present and well-formed; the backend remains the
// authority on whether they are registered.
function assertRawSourceTarget(target) {
    if (typeof target.subClient !== "string" ||
        typeof target.resource !== "string" ||
        !validDataScopeCode(target.subClient) ||
        !validDataScopeCode(target.resource)) {
        throw new RangeError("custd: raw source target requires subClient and resource as a pair of valid codes");
    }
}
// validateRawIngestResult requires an actual object carrying a boolean success
// and non-negative integer processed and failed. A missing field, a null, a
// wrong type, or a negative count is rejected rather than defaulted or coerced.
// Legitimate partial counts are returned unchanged.
function validateRawIngestResult(value, operationKey) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new CustdRawAcceptanceUnknownError({ operationKey });
    }
    const record = value;
    if (typeof record.success !== "boolean") {
        throw new CustdRawAcceptanceUnknownError({ operationKey });
    }
    return {
        success: record.success,
        processed: requireNonNegativeInteger(record.processed, operationKey),
        failed: requireNonNegativeInteger(record.failed, operationKey),
    };
}
function requireNonNegativeInteger(value, operationKey) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new CustdRawAcceptanceUnknownError({ operationKey });
    }
    return value;
}
export class RetryableError extends Error {
}
const REQUEST_ID_HEADER = "x-request-id";
function transportRequestError(error) {
    if (error instanceof Error && error.name === "AbortError")
        return error;
    return new CustdRequestError(null, "transport_unavailable", "bounded", { action: "retry", maxRetries: 1 }, undefined, { cause: error });
}
async function responseRequestError(response, fallbackCode, fallbackMessage, responseText) {
    const text = responseText ??
        (await response
            .clone()
            .text()
            .catch(() => ""));
    let problem;
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object" && parsed.status === response.status)
            problem = parsed;
    }
    catch {
        problem = undefined;
    }
    const retryability = problem?.retryability ?? (response.status === 429 || response.status >= 500 ? "bounded" : "none");
    const nextAction = problem?.nextAction ??
        (retryability === "bounded" ? { action: "retry", maxRetries: 1 } : { action: "none" });
    const code = problem?.code || fallbackCode;
    const requestId = response.headers.get(REQUEST_ID_HEADER) || problem?.traceId || "";
    const requestError = new CustdRequestError(response.status, code, retryability, nextAction, problem, {
        requestId,
    });
    if (fallbackMessage)
        requestError.message = fallbackMessage;
    return requestError;
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
// uuidv7 returns a canonical RFC 9562 version 7 UUID. Custd requires one as the
// Idempotency-Key of an OAuth client mutation.
function uuidv7() {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        crypto.getRandomValues(bytes);
    }
    else {
        for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Math.floor(Math.random() * 256);
        }
    }
    let timestamp = Date.now();
    for (let index = 5; index >= 0; index -= 1) {
        bytes[index] = timestamp % 256;
        timestamp = Math.floor(timestamp / 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/** Opaque per-event identity, including runtimes without Web Crypto. Not an authentication token. */
export function createEventId() {
    return randomUUID();
}
function randomUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16));
}
export * from "./admin-accounting-evidence.js";
export * from "./admin-campaign-email.js";
export * from "./admin-email-relay.js";
export * from "./admin-environment-policy.js";
export * from "./admin-error-issues.js";
export * from "./admin-event-types.js";
export * from "./admin-impersonation.js";
export * from "./admin-ingest-claims.js";
export * from "./admin-machine-access.js";
export * from "./admin-managed-audit.js";
export * from "./admin-measurement-projects.js";
export * from "./admin-notification-destinations.js";
export * from "./admin-notification-webhooks.js";
export * from "./admin-oauth-client-admissions.js";
export * from "./admin-rls.js";
export * from "./admin-sdk-usage.js";
export * from "./admin-support-access.js";
export * from "./admin-system.js";
export * from "./admin-uncertainty-models.js";
export * from "./analytics-reads.js";
export * from "./app-account.js";
export { createErrorCaptureEvent, ErrorCaptureClient, installBrowserErrorCapture, installNativeErrorCapture, } from "./error-capture.js";
export * from "./ingest-operations.js";
export * from "./measurement.js";
export * from "./public-reads.js";
export * from "./reporting-catalogue.js";
export { SiteAIOwnerSession } from "./site-ai-owner.js";
export * from "./site-monitor-reports.js";
export * from "./storefront.js";
