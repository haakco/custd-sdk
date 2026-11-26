/**
 * Ingest operator surfaces: diagnostics, monitoring, integrity, reprocessing and cleanup.
 * Every call is scoped to the credential's tenant unless it says otherwise.
 */
/** The header the cleanup-job reads and cancel take their tenant from. */
export const CLEANUP_EFFECTIVE_COMPANY_HEADER = "X-Custd-Effective-Company";
export const MANAGED_AUDIT_REDACTION_STATUSES = { redacted: "redacted", notFound: "not_found" };
/** The diagnostics sections ingest serves. Each returns the same full snapshot. */
export const INGEST_DIAGNOSTICS_SECTIONS = {
    ingest: "ingest",
    buffers: "buffers",
    database: "database",
    segments: "segments",
    reporting: "reporting",
};
export const CLEANUP_MODES = { generatedData: "generated-data" };
export const CLEANUP_JOB_STATUSES = {
    queued: "queued",
    dryRun: "dry_run",
    running: "running",
    completed: "completed",
    failed: "failed",
};
const cleanupJobsPath = "/cleanup/jobs";
const cleanupPlansPath = "/admin/cleanup/plans";
export class IngestOperationsClient {
    constructor(request, actingCompanySlug = "") {
        this.request = request;
        this.actingCompanySlug = actingCompanySlug;
    }
    // cleanupJobRequest sends a cleanup-job read or cancel, naming the configured acting
    // company in the only place those routes read a tenant from.
    cleanupJobRequest(method, path, options) {
        const headers = this.actingCompanySlug
            ? { [CLEANUP_EFFECTIVE_COMPANY_HEADER]: this.actingCompanySlug }
            : {};
        return this.request(method, path, undefined, options, headers);
    }
    /** The signed-in principal, tenant, roles and scopes. */
    async account(options) {
        const wire = await this.request("GET", "/account/me", undefined, options);
        return { ...wire, roles: wire.roles ?? [], permissions: wire.permissions ?? [], scopes: wire.scopes ?? [] };
    }
    /** Replays up to 100 of the tenant's rejected events through validation. */
    async reprocess(options) {
        const wire = await this.request("POST", "/reprocess", undefined, options);
        return { ...wire, outcomes: wire.outcomes ?? [] };
    }
    async redactManagedAudit(body, options) {
        const wire = await this.request("POST", "/managed-audit/redactions", body, options);
        return { ...wire, results: wire.results ?? [] };
    }
    async monitoringSummary(counters = "cached", options) {
        const query = counters === "measured" ? "?counters=measured" : "";
        const wire = await this.request("GET", `/monitoring/summary${query}`, undefined, options);
        return {
            ingestRequestsTotal: wire.ingest_requests_total ?? 0,
            ingestErrorsTotal: wire.ingest_errors_total ?? 0,
            eventSegmentsVerifiedRowsTotal: wire.event_segments_verified_rows_total ?? 0,
            rawEventsLandedTotal: wire.raw_events_landed_total ?? 0,
            rawStorageS3Total: wire.raw_storage_s3_total ?? 0,
            rawLandingS3UploadFailuresTotal: wire.raw_landing_s3_upload_failures_total ?? 0,
        };
    }
    async monitoringAlerts(options) {
        const wire = await this.request("GET", "/monitoring/alerts", undefined, options);
        return { alerts: (wire ?? []).map(({ type, ...alert }) => ({ ...alert, severity: type })) };
    }
    /** The platform-wide view. System administrators only. */
    async systemMonitoringSummary(options) {
        const wire = await this.request("GET", "/system/monitoring/summary", undefined, options);
        return {
            generatedAt: wire.generatedAt,
            totals: systemTotals(wire.totals ?? {}),
            topTenants: wire.topTenants ?? [],
        };
    }
    /** The data-path health snapshot, read through one of its section routes. System administrators only. */
    async diagnostics(section = "ingest", options) {
        const wire = await this.request("GET", `/diagnostics/${section}`, undefined, options);
        return {
            ...wire,
            pipeline: wire.pipeline ?? [],
            database: { ...wire.database, core: pool(wire.database.core), raw: pool(wire.database.raw) },
        };
    }
    /** Runs one retention cleanup pass for the tenant. */
    cleanup(options) {
        return this.request("POST", "/admin/cleanup", undefined, options);
    }
    /** Checks recent raw events against the accepted-landing ledger. */
    async checkIntegrity(options) {
        const wire = await this.request("POST", "/admin/integrity", undefined, options);
        return { checkedCount: wire.checkedCount, orphanedUuids: wire.orphanedUUIDs ?? [] };
    }
    async listCleanupPlans(options) {
        const wire = await this.request("GET", cleanupPlansPath, undefined, options);
        return { plans: (wire.plans ?? []).map(cleanupPlan) };
    }
    async createCleanupPlan(body, options) {
        return cleanupPlan(await this.request("POST", cleanupPlansPath, body, options));
    }
    async listCleanupJobs(options) {
        const wire = await this.cleanupJobRequest("GET", cleanupJobsPath, options);
        return { jobs: (wire.jobs ?? []).map(cleanupJob) };
    }
    async createCleanupJob(body, options) {
        return cleanupJob(await this.request("POST", cleanupJobsPath, body, options));
    }
    async getCleanupJob(jobUuid, options) {
        return cleanupJob(await this.cleanupJobRequest("GET", cleanupJobPath(jobUuid), options));
    }
    /** Cancels a job that has not started running and returns its state. */
    async cancelCleanupJob(jobUuid, options) {
        return cleanupJob(await this.cleanupJobRequest("POST", cleanupJobPath(jobUuid), options));
    }
    getCleanupJobProof(jobUuid, options) {
        return this.cleanupJobRequest("GET", `${cleanupJobPath(jobUuid)}/proof`, options);
    }
}
function cleanupJobPath(jobUuid) {
    return `${cleanupJobsPath}/${encodeURIComponent(jobUuid)}`;
}
function systemTotals(wire) {
    return {
        ingestRequestsTotal: wire.ingest_requests_total ?? 0,
        ingestErrorsTotal: wire.ingest_errors_total ?? 0,
        rawEventsLandedTotal: wire.raw_events_landed_total ?? 0,
        rawLandingS3UploadFailuresTotal: wire.raw_landing_s3_upload_failures_total ?? 0,
        dataSafetyInvariantViolationsTotal: wire.data_safety_invariant_violations_total ?? 0,
        storageUsageCollectorLastSuccessTimestamp: wire.storage_usage_collector_last_success_timestamp ?? 0,
        claimBacklogCount: wire.claim_backlog_count ?? 0,
        claimBacklogOldestAgeSeconds: wire.claim_backlog_oldest_age_seconds ?? 0,
    };
}
function pool(wire) {
    return { ...wire, writeStatements: wire.writeStatements ?? [] };
}
function cleanupPlan(wire) {
    return {
        ...wire,
        items: wire.items ?? [],
        scope: { ...wire.scope, approvedS3Prefixes: wire.scope.approvedS3Prefixes ?? [] },
    };
}
// Ingest serializes the approval without JSON tags, so its keys arrive capitalized.
function cleanupJob(wire) {
    const { approval, ...job } = wire;
    return {
        ...job,
        items: wire.items ?? [],
        approval: { identity: approval.Identity, expiresAt: approval.ExpiresAt },
    };
}
