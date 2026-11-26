/**
 * Notification webhooks and their deliveries. A subscription posts signed notifications to an HTTPS
 * endpoint or a Slack incoming webhook; its signing secret is shown only on create and rotate.
 */
const webhooksPath = "/notification-webhooks";
export class NotificationWebhookAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(companySlug) {
        const response = await this.request("GET", withCompany(webhooksPath, companySlug));
        return { subscriptions: response.subscriptions ?? [] };
    }
    create(body) {
        return this.request("POST", webhooksPath, body);
    }
    setEnabled(uuid, enabled, companySlug) {
        return this.request("PATCH", withCompany(webhookPath(uuid), companySlug), { enabled });
    }
    rotateSecret(uuid, companySlug) {
        return this.request("POST", withCompany(`${webhookPath(uuid)}/rotate-secret`, companySlug));
    }
    delete(uuid, companySlug) {
        return this.request("DELETE", withCompany(webhookPath(uuid), companySlug));
    }
    getDelivery(deliveryUuid, companySlug) {
        return this.request("GET", withCompany(deliveryPath(deliveryUuid), companySlug));
    }
    /** Queues the delivery again. */
    replay(deliveryUuid, body, companySlug) {
        return this.request("POST", withCompany(`${deliveryPath(deliveryUuid)}/replay`, companySlug), body);
    }
}
function webhookPath(uuid) {
    return `${webhooksPath}/${encodeURIComponent(uuid)}`;
}
function deliveryPath(uuid) {
    return `/notification-deliveries/${encodeURIComponent(uuid)}`;
}
function withCompany(path, companySlug) {
    return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
