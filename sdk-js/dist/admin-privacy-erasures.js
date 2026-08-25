// PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
// are forward-only. This client owns bounded polling and the single supported
// force-recovery attempt so product integrations do not recreate that workflow.
export class PrivacyErasureError extends Error {
    constructor(code, retryClassification, message) {
        super(message);
        this.code = code;
        this.retryClassification = retryClassification;
        this.name = "PrivacyErasureError";
        this.retryable = retryClassification === "retryable";
    }
}
export class PrivacyErasureClient {
    constructor(request) {
        this.request = request;
    }
    create(body, options) {
        return this.request("POST", "/privacy/erasures", body, options);
    }
    list(options) {
        return this.request("GET", "/privacy/erasures", undefined, options);
    }
    get(companySlug, requestUuid, options) {
        return this.request("GET", `/privacy/erasures/${encodeURIComponent(requestUuid)}?companySlug=${encodeURIComponent(companySlug)}`, undefined, options);
    }
    force(companySlug, requestUuid, options) {
        return this.request("POST", `/privacy/erasures/${encodeURIComponent(requestUuid)}/force?companySlug=${encodeURIComponent(companySlug)}`, undefined, options);
    }
    async createAndWait(body, options = {}) {
        const created = await this.create(body, options);
        await options.onProgress?.(created);
        return this.waitForCompletion(body.companySlug, created.requestUuid, { ...options, initialRequest: created });
    }
    async waitForCompletion(companySlug, requestUuid, options = {}) {
        const maxPolls = options.maxPolls ?? 60;
        const pollIntervalMs = options.pollIntervalMs ?? 1000;
        let current = options.initialRequest;
        let forced = false;
        for (let poll = 0; poll < maxPolls; poll += 1) {
            if (!current || poll > 0 || options.initialRequest) {
                if (pollIntervalMs > 0)
                    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
                current = await this.get(companySlug, requestUuid, options);
                await options.onProgress?.(current);
            }
            if (current.status === "s3_reflected")
                return current;
            if (current.status === "failed" && !forced) {
                const recovery = await this.force(companySlug, requestUuid, options);
                forced = true;
                if (recovery.safe_next_action) {
                    throw new PrivacyErasureError("force_recovery_blocked", "non_retryable", `Custd privacy erasure recovery blocked (${recovery.safe_next_action_code || "unknown"})`);
                }
                current = recovery.request;
            }
        }
        throw new PrivacyErasureError("poll_timeout", "retryable", "Custd privacy erasure did not complete within the polling limit");
    }
}
