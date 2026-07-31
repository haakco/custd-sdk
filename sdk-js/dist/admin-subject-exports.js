// SubjectExportClient owns per-tenant subject export requests. The download
// surface returns a short-lived signed URL the SDK must surface only to the
// caller; it must not be logged or echoed into error messages.
export class SubjectExportClient {
    constructor(request) {
        this.request = request;
    }
    create(body, options) {
        return this.request("POST", "/subject-exports", body, options);
    }
    list(options) {
        return this.request("GET", "/subject-exports", undefined, options);
    }
    get(requestId, options) {
        return this.request("GET", `/subject-exports/${encodeURIComponent(requestId)}`, undefined, options);
    }
    cancel(requestId, options) {
        return this.request("POST", `/subject-exports/${encodeURIComponent(requestId)}/cancel`, undefined, options);
    }
    // Download returns a short-lived signed URL. The downloadUrl field is
    // sensitive; callers must not log the URL or echo it into error messages.
    download(requestId, options) {
        return this.request("GET", `/subject-exports/${encodeURIComponent(requestId)}/download`, undefined, options);
    }
    force(requestId, options) {
        return this.request("POST", `/subject-exports/${encodeURIComponent(requestId)}/force`, undefined, options);
    }
}
