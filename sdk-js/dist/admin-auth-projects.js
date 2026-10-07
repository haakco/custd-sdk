// AuthProjectAdminClient manages Custd projects, their environments, and the
// application principals a directory holds inside an environment through
// /api/v1/admin/auth-projects.
//
// Every call is a control-plane call that a machine credential may make only
// when it names the platform user it acts for. Set `owningUserUuid` on the
// call's RequestOptions and it is sent as X-Custd-Owning-User-UUID; Custd
// validates the named user as a live member of the machine caller's own
// company. A human administrator's own token subject is the actor and leaves
// the option unset.
export class AuthProjectAdminClient {
    constructor(request) {
        this.request = request;
    }
    /**
     * List up to 100 environments the named owning user owns or operates. Pass the
     * previous page's `nextAfter` as `after` for the next page.
     */
    listProjects(after, options) {
        const cursor = after === undefined ? "" : after.trim();
        const path = cursor === "" ? "/auth-projects" : `/auth-projects?after=${encodeURIComponent(cursor)}`;
        return this.request("GET", path, undefined, options);
    }
    /** Create the named owning user's project ownership, identity pool and first paused environment. */
    async createProject(body, options) {
        return this.request("POST", "/auth-projects", body, requireIdempotencyKey(options));
    }
    /** Add a further environment to an existing project. The new environment starts paused. */
    createEnvironment(projectId, body, options) {
        const path = `/auth-projects/${encodeURIComponent(projectId)}/environments`;
        return this.request("POST", path, body, options);
    }
    /** Report the sessions the directory currently holds for one application principal. */
    listPrincipalSessions(projectId, environmentId, directoryId, providerSubject, options) {
        const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions`;
        return this.request("GET", path, undefined, options);
    }
    /** End exactly one of a principal's sessions, leaving its other sessions untouched. */
    async revokePrincipalSession(projectId, environmentId, directoryId, providerSubject, body, options) {
        const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions/revoke`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** End every session the directory holds for one application principal. */
    async revokePrincipalSessions(projectId, environmentId, directoryId, providerSubject, body, options) {
        const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions/revoke-all`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** End one application identity's membership of one organisation. */
    revokePrincipalMembership(projectId, environmentId, directoryId, providerSubject, body, options) {
        const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/memberships/revoke`;
        return this.request("POST", path, body, options);
    }
    /**
     * Write the environment's desired state and return the operation receipt.
     * Custd makes it retry-safe per Idempotency-Key, so the key is required. The
     * audience binding the consumer's edge admits against is written here and read
     * back through `getEnvironmentStatus`.
     */
    async applyEnvironmentDesiredState(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/apply`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Report the field-level changes an apply would make. A preview writes nothing. */
    previewEnvironmentDesiredState(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/preview`;
        return this.request("POST", path, body, options);
    }
    /**
     * Read the environment's configured state and applied revision. `status.desired.audiences`
     * carries the applied audience binding and `status.environmentId` the
     * environment binding, so a caller reads the mapping back here after an apply.
     */
    getEnvironmentStatus(projectId, environmentId, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/status`;
        return this.request("GET", path, undefined, options);
    }
}
// environmentDesiredStatePath addresses one environment under one project. Every
// segment is escaped so a caller-supplied identifier cannot reshape the path.
function environmentDesiredStatePath(projectId, environmentId) {
    return `/auth-projects/${encodeURIComponent(projectId)}` + `/environments/${encodeURIComponent(environmentId)}`;
}
// applicationPrincipalPath addresses one application principal inside one
// directory. Every segment is escaped so a caller-supplied identifier cannot
// reshape the path.
function applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject) {
    return (`/auth-projects/${encodeURIComponent(projectId)}` +
        `/environments/${encodeURIComponent(environmentId)}` +
        `/directories/${encodeURIComponent(directoryId)}` +
        `/principals/${encodeURIComponent(providerSubject)}`);
}
// requireIdempotencyKey rejects an empty key on the routes Custd makes
// retry-safe, so a caller gets one clear error instead of a service 400.
function requireIdempotencyKey(options) {
    const key = options?.idempotencyKey;
    if (typeof key !== "string" || key.trim() === "") {
        throw new Error("custd: auth-project idempotency key is required");
    }
    return options ?? {};
}
