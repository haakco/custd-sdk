// OffboardingClient owns the offboarding schedule and one-off request
// surfaces. Schedule writes the effective tenant server-side; callers must
// not pre-fill tenantSlug on the request body. The tenant is derived from
// the authenticated client context.
export class OffboardingClient {
    constructor(request) {
        this.request = request;
    }
    // schedule writes a delayed offboarding schedule for the effective tenant.
    // The server pulls the tenant from the auth context; do not include
    // tenantSlug in the request body. The collection endpoint is POST
    // /offboarding/schedules.
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
    cancelRequest(requestUuid, options) {
        return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/cancel`, undefined, options);
    }
    confirmRequest(requestUuid, options) {
        return this.request("POST", `/offboarding/${encodeURIComponent(requestUuid)}/confirm`, undefined, options);
    }
    // preview asks the server to compute the per-store inventory estimate for
    // the offboarding request. The result is server-issued and must be
    // surfaced verbatim; the SDK must not re-derive estimatedCount.
    preview(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/preview`, undefined, options);
    }
    // export triggers the destructive export packaging for a request. The
    // response is the per-request artifact metadata; the download URL is
    // fetched separately via download.
    export(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/export`, undefined, options);
    }
    // download returns a short-lived signed URL for the offboarding export
    // artifact. The downloadUrl is sensitive; callers must not log it or
    // echo it into error messages.
    download(requestUuid, options) {
        return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/download`, undefined, options);
    }
    // acknowledge records that the operator (or client) has accepted the
    // preview. After acknowledgment the server is willing to accept execute.
    acknowledge(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/acknowledge`, undefined, options);
    }
    // execute triggers the destructive phase. The server requires a non-empty
    // waiver.role; an empty waiver returns 400 waiver_required, which the
    // SDK surfaces without retry.
    execute(requestUuid, body, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/execute`, body, options);
    }
    // retry re-arms an offboarding request that previously failed. The server
    // decides whether the request is retryable; the SDK does not pre-filter.
    retry(requestUuid, options) {
        return this.request("POST", `/offboarding/requests/${encodeURIComponent(requestUuid)}/retry`, undefined, options);
    }
    // receipt returns the terminal offboarding receipt for a request. The
    // sha256 digest is the signed evidence the client must retain alongside
    // its offboarding record.
    receipt(requestUuid, options) {
        return this.request("GET", `/offboarding/requests/${encodeURIComponent(requestUuid)}/receipt`, undefined, options);
    }
}
