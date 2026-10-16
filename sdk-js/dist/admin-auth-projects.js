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
/**
 * Raised when every step ran but the provider registrations are not known to
 * describe the environment's current configuration: the honest answer for a
 * provision that is not finished, rather than a success whose status is
 * visibly unreconciled.
 */
export class AuthProjectRealmNotConvergedError extends Error {
    constructor(reconcileNote) {
        super(`custd: auth-project realm did not converge${reconcileNote ? `: ${reconcileNote}` : ""}`);
        this.reconcileNote = reconcileNote;
        this.name = "AuthProjectRealmNotConvergedError";
    }
}
/**
 * Raised when a realm provision stops early. It carries the failed step and the
 * receipt of every step that completed.
 */
export class AuthProjectRealmProvisionError extends Error {
    constructor(failedStep, receipt, cause) {
        super(`custd: realm provision failed at step ${failedStep}`);
        this.failedStep = failedStep;
        this.receipt = receipt;
        this.name = "AuthProjectRealmProvisionError";
        this.cause = cause;
    }
}
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
    /**
     * Record the authenticated human owner's company on an explicitly unbound historical project.
     *
     * It is the actionable step a `company_binding_required` refusal names: the body is empty, Custd
     * refuses a machine credential and a foreign rebind, and repeating it for the same company is
     * safe, so it carries no idempotency key.
     */
    bindProjectCompany(projectId, options) {
        const path = `/auth-projects/${encodeURIComponent(projectId)}/company-binding`;
        return this.request("POST", path, undefined, options);
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
    /** Withdraw authority and revoke the sessions of every identity owned by this principal. */
    async suspendPrincipal(target, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/suspend`;
        return this.request("POST", path, undefined, requireIdempotencyKey(options));
    }
    /** Restore authority without changing factors; a pending erasure cannot be restored. */
    async restorePrincipal(target, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/restore`;
        return this.request("POST", path, undefined, requireIdempotencyKey(options));
    }
    /** Read the portable public record and its provider-trait completeness status. */
    exportPrincipal(target, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/export`;
        return this.request("GET", path, undefined, options);
    }
    /** Erase the complete principal-owned mapping set through the server's durable operation. */
    async erasePrincipal(target, body, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/erase`;
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
    /** Read the environment's supported auth configuration. */
    getEnvironmentCapability(projectId, environmentId, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/capability`;
        return this.request("GET", path, undefined, options);
    }
    /** Report every directory in the environment and whether it is fully stored. */
    listDirectories(projectId, environmentId, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/directories`;
        return this.request("GET", path, undefined, options);
    }
    /** Enable, pause, resume or release one directory credential store. */
    async actOnDirectory(projectId, environmentId, action, body, options) {
        if (!directoryActions.includes(action)) {
            throw new Error(`custd: auth-project directory action ${String(action)} is not one of enable, pause, resume or release`);
        }
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/directories/${encodeURIComponent(action)}`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Report the organisations one environment's directory holds. */
    listEnvironmentOrganisations(projectId, environmentId, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/organisations`;
        return this.request("GET", path, undefined, options);
    }
    /**
     * List the application principals every directory in the environment holds. The
     * owning-user header is taken from `options` like the other project-auth reads,
     * and paging continues with the opaque `nextCursor` the previous page returned.
     */
    listPrincipals(projectId, environmentId, query = {}, options) {
        const parts = [];
        // The cursor is opaque: only an absent or genuinely empty value is dropped, and
        // every other string is url-encoded byte-for-byte without normalization.
        const cursor = query.cursor;
        if (cursor !== undefined && cursor !== "") {
            parts.push(`cursor=${encodeURIComponent(cursor)}`);
        }
        if (query.limit !== undefined && query.limit > 0) {
            parts.push(`limit=${encodeURIComponent(String(query.limit))}`);
        }
        const suffix = parts.length === 0 ? "" : `?${parts.join("&")}`;
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/principals${suffix}`;
        return this.request("GET", path, undefined, options);
    }
    /** Register the environment's application clients with the provider. */
    async reconcileEnvironmentClients(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/clients/reconcile`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Report the environment's invitations, newest first. */
    listInvitations(projectId, environmentId, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations`;
        return this.request("GET", path, undefined, options);
    }
    /** Invite one address into a directory and return the one-time link. */
    async issueInvitation(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Withdraw a live invitation before it is used. */
    async revokeInvitation(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations/revoke`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Replace one live invitation's link and return the fresh one-time link. */
    async redeliverInvitation(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations/redeliver`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** Read one application principal's profile values. */
    getPrincipalProfile(target, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/profile`;
        return this.request("GET", path, undefined, options);
    }
    /** Set one application principal's profile values as an upsert. */
    async setPrincipalProfile(target, body, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/profile`;
        return this.request("POST", path, body, requireIdempotencyKey(options));
    }
    /** List the organisations one application principal may act for. */
    listPrincipalMemberships(target, options) {
        const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/memberships`;
        return this.request("GET", path, undefined, options);
    }
    /** Delete a project and everything scoped to it. `confirmSlug` must name the stored project slug. */
    deleteProject(projectId, body, options) {
        const path = `/auth-projects/${encodeURIComponent(projectId)}/delete`;
        return this.request("POST", path, body, options);
    }
    /** Delete one environment without touching its siblings. `confirmSlug` must name the stored environment slug. */
    deleteEnvironment(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/delete`;
        return this.request("POST", path, body, options);
    }
    /**
     * Withdraw one environment's authority and reconcile its owned provider clients
     * away while retaining the environment and its identity data. It is the safe step
     * for an environment whose directory still holds a credential store, which a
     * physical delete refuses. `confirmSlug` must name the stored environment slug.
     * The route has no idempotency key: a retry resumes the provider stage.
     */
    offboardEnvironment(projectId, environmentId, body, options) {
        const path = `${environmentDesiredStatePath(projectId, environmentId)}/offboard`;
        return this.request("POST", path, body, options);
    }
    /**
     * Set one environment's identity realm up through the public control plane in
     * the order the service requires, so a consumer does not have to sequence
     * separate calls itself. Each write advances the environment's authority
     * revision, so the order matters:
     *
     * 1. Apply the desired state (which also runs the client registration it implies).
     * 2. Enable the directory credential store, naming the revision the apply produced.
     *    The service compares that revision against the environment's current revision,
     *    so a caller-supplied revision would conflict on every fresh setup.
     * 3. Reconcile the environment's clients at the revision the directory enable
     *    produced, because the enable moved the revision past the observation the apply
     *    recorded and status reports a stale observation as unreconciled.
     * 4. Read status and refuse to report success while the provider is not known to
     *    hold the configured registrations.
     *
     * Each mutating step derives a stable key from the base `idempotencyKey` in
     * options, so retrying the whole call with the same base key resumes rather
     * than duplicating. The base must be 8 to 111 characters, so every derived key
     * stays within the service's 8 to 128 bound. On failure the thrown
     * {@link AuthProjectRealmProvisionError} carries `failedStep` and the receipt
     * of every step that completed, with the original error as its `cause`.
     */
    async provisionRealm(projectId, environmentId, request, options) {
        const base = requireRealmBaseKey(options);
        const receipt = { projectId, environmentId };
        let apply;
        try {
            apply = await this.applyEnvironmentDesiredState(projectId, environmentId, request.desiredStateRequest, {
                ...options,
                idempotencyKey: `${base}:apply`,
            });
        }
        catch (error) {
            receipt.failedStep = "apply";
            throw new AuthProjectRealmProvisionError("apply", receipt, error);
        }
        receipt.apply = apply;
        // The enable names the revision the apply committed. The service compares the
        // expected revision against the environment's current revision, which the apply
        // just advanced, so the caller's read must not be reused here.
        let directory;
        try {
            directory = await this.actOnDirectory(projectId, environmentId, "enable", { poolId: request.directoryPoolId, expectedRevision: apply.revision }, { ...options, idempotencyKey: `${base}:directory-enable` });
        }
        catch (error) {
            receipt.failedStep = "directory_enable";
            throw new AuthProjectRealmProvisionError("directory_enable", receipt, error);
        }
        receipt.directory = directory;
        // Enabling advanced the revision again, so the observation the apply recorded is
        // behind the environment. Reconcile at the directory's revision to record the
        // provider state that describes the configuration as it is now.
        let reconcile;
        try {
            reconcile = await this.reconcileEnvironmentClients(projectId, environmentId, { expectedRevision: directory.revision }, { ...options, idempotencyKey: `${base}:client-reconcile` });
        }
        catch (error) {
            receipt.failedStep = "client_reconcile";
            throw new AuthProjectRealmProvisionError("client_reconcile", receipt, error);
        }
        receipt.reconcile = reconcile;
        // Status is a read, so it does not carry the workflow's write key.
        let status;
        try {
            status = await this.getEnvironmentStatus(projectId, environmentId, {
                ...options,
                idempotencyKey: undefined,
            });
        }
        catch (error) {
            receipt.failedStep = "status";
            throw new AuthProjectRealmProvisionError("status", receipt, error);
        }
        receipt.status = status;
        if (!status.reconciled) {
            receipt.failedStep = "status";
            throw new AuthProjectRealmProvisionError("status", receipt, new AuthProjectRealmNotConvergedError(status.reconcileNote));
        }
        return receipt;
    }
}
/** One directory credential-store action Custd defines. */
const directoryActions = ["enable", "pause", "resume", "release"];
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
// The service bounds an Idempotency-Key at 8 to 128 characters. A realm provision
// derives one key per mutating step by appending a suffix to the caller's base key,
// so the base itself is bounded here to keep every derived key legal. The longest
// suffix is ":directory-enable" (17 characters), matching the Go contract.
const realmMinKeyLength = 8;
const realmMaxKeyLength = 128;
const realmLongestSuffix = ":directory-enable";
// requireRealmBaseKey validates the workflow's base key before any request is sent,
// so a caller gets one clear error instead of a service rejection on a derived key
// whose suffix pushed it past the bound.
function requireRealmBaseKey(options) {
    const base = options?.idempotencyKey?.trim() ?? "";
    if (base === "") {
        throw new Error("custd: auth-project realm provision requires a base idempotency key");
    }
    if (base.length < realmMinKeyLength) {
        throw new Error(`custd: auth-project realm base idempotency key must be at least ${realmMinKeyLength} characters`);
    }
    const maxBase = realmMaxKeyLength - realmLongestSuffix.length;
    if (base.length > maxBase) {
        throw new Error(`custd: auth-project realm base idempotency key must be at most ${maxBase} characters so every per-step key stays within ${realmMaxKeyLength}`);
    }
    return base;
}
