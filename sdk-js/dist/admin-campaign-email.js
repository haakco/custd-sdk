/**
 * Campaign email: published revisions and their rendering, scheduled runs, recipient permission, and
 * the welcome journey (welcome then reminder) driven by confirmed signups and activations.
 */
export class CampaignEmailAdminClient {
    constructor(request) {
        this.request = request;
    }
    createRevision(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-revisions", companySlug), body);
    }
    getRevision(revision, companySlug) {
        return this.request("GET", scoped(revisionPath(revision), companySlug));
    }
    renderRevision(revision, body) {
        return this.request("POST", `${revisionPath(revision)}/render`, body);
    }
    previewRevision(revision, body, companySlug) {
        return this.request("POST", scoped(`${revisionPath(revision)}/preview`, companySlug), body);
    }
    startRun(body, companySlug) {
        return this.run("POST", "/campaign-email-runs", companySlug, body);
    }
    getRun(runId, companySlug) {
        return this.run("GET", runPath(runId), companySlug);
    }
    cancelRun(runId, companySlug) {
        return this.run("POST", `${runPath(runId)}/cancel`, companySlug);
    }
    checkPermission(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-permissions/check", companySlug), body);
    }
    confirmPermission(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-permissions/confirm", companySlug), body);
    }
    withdrawPermission(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-permissions/withdraw", companySlug), body);
    }
    putWelcomeDefinition(body, companySlug) {
        return this.request("PUT", scoped("/campaign-email-welcome/definition", companySlug), body);
    }
    setWelcomePaused(body, companySlug) {
        return this.request("PUT", scoped("/campaign-email-welcome/pause", companySlug), body);
    }
    recordWelcomeConfirmedSignup(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-welcome/confirmed-signup", companySlug), body);
    }
    recordWelcomeActivation(body, companySlug) {
        return this.request("POST", scoped("/campaign-email-welcome/activation", companySlug), body);
    }
    getWelcomeContact(contactId, companySlug) {
        return this.request("GET", scoped(`/campaign-email-welcome/contacts/${encodeURIComponent(contactId)}`, companySlug));
    }
    async run(method, path, companySlug, body) {
        const status = await this.request(method, scoped(path, companySlug), body);
        return { ...status, deliveries: status.deliveries ?? [] };
    }
}
function revisionPath(revision) {
    return `/campaign-email-revisions/${encodeURIComponent(revision)}`;
}
function runPath(runId) {
    return `/campaign-email-runs/${encodeURIComponent(runId)}`;
}
function scoped(path, companySlug) {
    return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
