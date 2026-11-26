/**
 * Calls that carry none of the client's own credentials: a hosted app's public discovery document, a
 * shared site report opened by its link token, the auth-domain inventory an external checker probes
 * with its monitoring key, and a published status page with its email subscriptions.
 */
/** Carries the external checker's monitoring key, its only credential. */
export const AUTH_DOMAIN_MONITORING_KEY_HEADER = "X-Custd-Auth-Domain-Monitoring-Key";
export class PublicReadClient {
    constructor(read, write = () => Promise.reject(new Error("custd: public writes need a writer"))) {
        this.read = read;
        this.write = write;
    }
    /** Reads a hosted app's public discovery document by host. A host that serves no app answers 404. */
    async appDiscovery(host, options) {
        const document = await this.read(`/app-hosts/${encodeURIComponent(host)}/discovery`, {}, options);
        return { ...document, capabilities: document.capabilities ?? [], allowedOrigins: document.allowedOrigins ?? [] };
    }
    /** Reads the site report a share link opens. The share token is the only authority. */
    sharedSiteReport(token, options) {
        if (token.trim() === "")
            return Promise.reject(new Error("custd: shared site report requires a share token"));
        return this.read(`/shared-site-reports/${encodeURIComponent(token)}`, {}, options);
    }
    /** Returns the realm hostnames the external checker may probe. */
    async authDomainMonitoringInventory(monitoringKey, options) {
        if (monitoringKey.trim() === "") {
            return Promise.reject(new Error("custd: auth domain monitoring requires a monitoring key"));
        }
        const inventory = await this.read("/auth-domain-monitoring/inventory", { [AUTH_DOMAIN_MONITORING_KEY_HEADER]: monitoringKey }, options);
        return { hosts: inventory.hosts ?? [], retiredHosts: inventory.retiredHosts ?? [] };
    }
    /** Reads a published status page by its public key. An unpublished key answers 404. */
    async statusPage(key, options) {
        const page = await this.read(statusPagePath(key), {}, options);
        return { ...page, components: page.components ?? [], updates: page.updates ?? [] };
    }
    /**
     * Asks for a confirmation email. The server answers the same way for an unknown key, so success does
     * not prove the page exists.
     */
    async subscribeToStatusPage(key, request, options) {
        return this.write(`${statusPagePath(key)}/subscribe`, request, options);
    }
    /** Confirms a subscription with the emailed token. */
    async confirmStatusPageSubscription(key, token, options) {
        return this.write(`${statusPagePath(key)}/confirm-subscription`, token, options);
    }
    /** Ends a subscription with the emailed token. */
    async unsubscribeFromStatusPage(key, token, options) {
        return this.write(`${statusPagePath(key)}/unsubscribe`, token, options);
    }
}
function statusPagePath(key) {
    if (key.trim() === "")
        throw new Error("custd: public status page requires its key");
    return `/public-status-pages/${encodeURIComponent(key)}`;
}
