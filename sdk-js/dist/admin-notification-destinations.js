/**
 * Where each tenant notification event is delivered: by email to one recipient, or to the tenant's
 * webhook or Slack subscriptions.
 */
export class NotificationDestinationAdminClient {
    constructor(request) {
        this.request = request;
    }
    get(eventSlug, companySlug) {
        return this.request("GET", destinationPath(eventSlug, companySlug));
    }
    put(eventSlug, body, companySlug) {
        return this.request("PUT", destinationPath(eventSlug, companySlug), body);
    }
}
function destinationPath(eventSlug, companySlug) {
    const path = `/notification-destinations/${encodeURIComponent(eventSlug)}`;
    return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
