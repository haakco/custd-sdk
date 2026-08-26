// OffboardingClient owns the offboarding schedule and one-off request
// surfaces. Its types mirror the current admin-api JSON wire contract.
function mapPreview(response) {
    return {
        ...response,
        stores: response.stores.map((store) => ({
            store: store.store,
            kind: store.kind,
            retentionClass: store.retention_class,
            estimatedCount: store.estimated_count,
            ...(store.source_authority ? { sourceAuthority: store.source_authority } : {}),
        })),
    };
}
function mapReceipt(response) {
    return {
        companyId: response.company_id,
        requestedByActor: response.requested_by_actor,
        requestedByUserId: response.requested_by_user_id,
        requestedAt: response.requested_at,
        completedAt: response.completed_at,
        finalState: response.final_state,
        perStore: response.per_store.map((store) => ({
            store: store.store,
            retentionClass: store.retention_class,
            deletedCount: store.deleted_count,
            retainedExceptionsCount: store.retained_exceptions_count,
        })),
        waiver: response.waiver,
        sha256: response.sha256,
    };
}
export class OffboardingClient {
    constructor(request) {
        this.request = request;
    }
    // schedule writes a delayed offboarding schedule. tenantSlug is required and
    // must match the authenticated tenant scope.
    schedule(body, options) {
        return this.request("POST", "/offboarding/schedules", body, options);
    }
    listSchedules(options) {
        return this.request("GET", "/offboarding/schedules", undefined, options);
    }
    // getSchedule reads the delayed offboarding schedule for a single tenant.
    // It targets the per-tenant route GET /offboarding/schedules/{tenantSlug},
    // which is distinct from the global listSchedules collection read.
    getSchedule(tenantSlug, options) {
        return this.request("GET", `/offboarding/schedules/${encodeURIComponent(tenantSlug)}`, undefined, options);
    }
    cancelSchedule(tenantSlug, body, options) {
        return this.request("POST", `/offboarding/schedules/${encodeURIComponent(tenantSlug)}/cancel`, body, options);
    }
    // request submits a one-off offboarding request for the effective tenant
    // via POST /offboarding. The confirmation field must match the tenant
    // slug the server reads from the auth context; mismatches fail with 400.
    requestOffboarding(body, options) {
        return this.request("POST", "/offboarding", body, options);
    }
    getRequest(requestUuid, options) {
        return this.request("GET", `/offboarding/${encodeURIComponent(requestUuid)}`, undefined, options);
    }
    cancelRequest(requestUuid, body, options) {
        return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/cancel`, body, options);
    }
    confirmRequest(requestUuid, options) {
        return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/confirm`, undefined, options);
    }
    // preview asks the server to compute the per-store inventory estimate for
    // the offboarding request. The result is server-issued and must be
    // surfaced verbatim; the SDK must not re-derive estimatedCount.
    async preview(requestUuid, options) {
        const response = await this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/preview`, undefined, options);
        return mapPreview(response);
    }
    // export triggers the destructive export packaging for a request. The
    // response is the per-request artifact metadata; the download URL is
    // fetched separately via download.
    export(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/export`, undefined, options);
    }
    // download returns the durable export descriptor and a short-lived signed
    // URL for the offboarding artifact. The downloadUrl is sensitive; callers
    // must not log it or echo it into error messages.
    download(requestUuid, options) {
        return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/download`, undefined, options);
    }
    // acknowledge records that the export was downloaded successfully and its
    // inventory was confirmed. Never call it merely because preview succeeded.
    acknowledge(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/acknowledge`, undefined, options);
    }
    // execute triggers the destructive phase. The server requires a non-empty
    // waiver.role; an empty waiver returns 400 waiver_required, which the
    // SDK surfaces without retry.
    execute(requestUuid, body, options) {
        const wireBody = {
            waiver_role: body.waiver.role,
            waiver_reason: body.waiver.reason,
            ...(body.waiver.timestamp ? { waiver_timestamp: body.waiver.timestamp } : {}),
        };
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/execute`, wireBody, options).then(mapReceipt);
    }
    // retry re-arms an offboarding request that previously failed. The server
    // decides whether the request is retryable; the SDK does not pre-filter.
    retry(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/retry`, undefined, options).then(mapReceipt);
    }
    // receipt returns the terminal offboarding receipt for a request. The
    // sha256 is an unkeyed integrity checksum the client must retain alongside
    // its offboarding record; it is not an authenticity signature.
    receipt(requestUuid, options) {
        return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/receipt`, undefined, options).then(mapReceipt);
    }
}
