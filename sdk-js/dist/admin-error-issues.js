/**
 * Grouped error issues captured from a tenant's apps: list, read with the latest event, and set state.
 */
export class ErrorIssueAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(query = {}) {
        const params = new URLSearchParams();
        for (const [name, value] of Object.entries(query)) {
            if (value !== undefined && value !== "")
                params.set(name, String(value));
        }
        const search = params.toString();
        const response = await this.request("GET", search ? `/error-issues?${search}` : "/error-issues");
        return { ...response, issues: (response.issues ?? []).map(issue) };
    }
    async get(issueUuid, companySlug) {
        const detail = await this.request("GET", scoped(issuePath(issueUuid), companySlug));
        return {
            ...detail,
            issue: issue(detail.issue),
            latestEvent: event(detail.latestEvent),
        };
    }
    async setState(issueUuid, state, companySlug) {
        const body = { state };
        return issue(await this.request("POST", scoped(`${issuePath(issueUuid)}/state`, companySlug), body));
    }
}
function issue(wire) {
    return { ...wire, environments: wire.environments ?? [] };
}
function event(wire) {
    return {
        ...wire,
        exceptions: (wire.exceptions ?? []).map((exception) => ({
            ...exception,
            frames: (exception.frames ?? []).map((frame) => ({
                ...frame,
                preContext: frame.preContext ?? [],
                postContext: frame.postContext ?? [],
            })),
        })),
    };
}
function issuePath(issueUuid) {
    return `/error-issues/${encodeURIComponent(issueUuid)}`;
}
function scoped(path, companySlug) {
    return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
