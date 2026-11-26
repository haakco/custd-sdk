/**
 * Admin event types and event categories: retention and rollup dimensions. An event type inherits its
 * category's retention when its own retentionDays is null. Categories are platform-wide and need a
 * system administrator.
 */
export class EventTypeAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** A system administrator names the tenant; a tenant administrator always reads its own. */
    async list(companySlug) {
        const response = await this.request("GET", scoped("/event-types", companySlug));
        return { eventTypes: response.eventTypes ?? [] };
    }
    update(slug, body, companySlug) {
        return this.request("PATCH", scoped(`/event-types/${encodeURIComponent(slug)}`, companySlug), body);
    }
    async listCategories() {
        const response = await this.request("GET", "/event-categories");
        return { eventCategories: response.eventCategories ?? [] };
    }
    updateCategory(slug, body) {
        return this.request("PATCH", `/event-categories/${encodeURIComponent(slug)}`, body);
    }
}
function scoped(path, companySlug) {
    return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
