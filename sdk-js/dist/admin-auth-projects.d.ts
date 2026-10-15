import type { RequestOptions } from "./index.js";
/** How an environment's identity boundary is shared. Custd owns both values. */
export type AuthProjectIdentityMode = "isolated" | "shared";
/** Body of POST /api/v1/admin/auth-projects. */
export type AuthProjectCreateRequest = {
    slug: string;
    name: string;
    environmentSlug: string;
    identityMode: AuthProjectIdentityMode;
};
/** Body of POST /api/v1/admin/auth-projects/{projectId}/environments. */
export type AuthProjectEnvironmentCreateRequest = {
    slug: string;
    name: string;
    identityMode: AuthProjectIdentityMode;
};
/** One project and the environment the call is scoped to. */
export type AuthProjectSummary = {
    projectId: string;
    slug: string;
    name: string;
    environmentId: string;
    environmentSlug: string;
    identityMode: AuthProjectIdentityMode;
};
/** Response to creating a project. */
export type AuthProjectCreation = {
    project: AuthProjectSummary;
    operationId: string;
    /** The same body and Idempotency-Key returned the original operation. */
    replayed: boolean;
    /** The environment is serving; it does not mean application login is enabled. */
    runtimeReady: boolean;
};
/** One page of GET /api/v1/admin/auth-projects. */
export type AuthProjectListResponse = {
    projects: AuthProjectSummary[];
    /** Cursor for the next page; absent on the last page. */
    nextAfter?: string;
};
/** One session a directory holds for an application principal. No token or credential. */
export type ApplicationSession = {
    sessionId: string;
    active: boolean;
    authenticatedAt?: string;
    authenticatorAssuranceLevel?: string;
    expiresAt?: string;
    issuedAt?: string;
};
/** Response to listing one application principal's live sessions. */
export type ApplicationSessionInventory = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    sessions: ApplicationSession[];
};
/** Body of POST .../principals/{providerSubject}/sessions/revoke. */
export type ApplicationSessionRevokeRequest = {
    sessionId: string;
};
/** Response to revoking sessions. */
export type ApplicationSessionRevocation = {
    projectId: string;
    directoryId: string;
    principalId: string;
    /** Number of sessions ended. */
    revoked: number;
    sessionId?: string;
};
/** Body of POST .../principals/{providerSubject}/sessions/revoke-all. */
export type ApplicationSessionsRevokeAllRequest = {
    /** Must be true; a missing field is never read as the strongest action. */
    confirm: boolean;
};
/** Body of POST .../principals/{providerSubject}/memberships/revoke. */
export type ApplicationMembershipRevokeRequest = {
    organisationId: string;
};
/** Response to ending a membership. The row is kept with removedAt stamped. */
export type ApplicationMembershipRevocation = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    organisationId: string;
    removedAt: string;
    removed: boolean;
};
/** Server-owned principal address; every identifier is escaped as a path segment. */
export type ApplicationPrincipalTarget = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    providerSubject: string;
};
export type ApplicationPrincipalSuspension = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    enabled: boolean;
    sessionsRevoked: number;
    revision: number;
    replayed: boolean;
};
export type ApplicationPrincipalMembershipView = {
    organisationId: string;
    organisationSlug: string;
    organisationName: string;
    role: string;
    createdAt: string;
    removedAt?: string;
};
export type ApplicationPrincipalProfileValueView = {
    fieldKey: string;
    value: string;
};
export type ApplicationIdentityTraitValue = string | number | boolean | null | ApplicationIdentityTraitValue[] | {
    [name: string]: ApplicationIdentityTraitValue;
};
export type ApplicationIdentityTrait = {
    name: string;
    value: ApplicationIdentityTraitValue;
};
export type ApplicationIdentityTraitsStatus = "included" | "incomplete" | "identity_absent" | "directory_unavailable" | "provider_unreadable";
export type ApplicationPrincipalIdentityExport = {
    providerIssuer: string;
    providerSubject: string;
    traitsStatus: ApplicationIdentityTraitsStatus;
    traits: ApplicationIdentityTrait[] | null;
};
/** Every public identity carries its own completeness status; never credential material. */
export type ApplicationPrincipalExport = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    enabled: boolean;
    createdAt: string;
    identities: ApplicationPrincipalIdentityExport[] | null;
    memberships: ApplicationPrincipalMembershipView[] | null;
    profileValues: ApplicationPrincipalProfileValueView[] | null;
};
/** Explicit confirmation is mandatory; erasure has no default strongest action. */
export type ApplicationPrincipalErasureRequest = {
    confirm: true;
};
export type ApplicationPrincipalErasure = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    status: string;
    invitations: number;
    magicLinks: number;
    memberships: number;
    mappings: number;
    profileValues: number;
    principals: number;
    revision: number;
    replayed: boolean;
    /** False on a replay whose receipt does not carry the original deletion counts. */
    countsRecorded: boolean;
};
/** One application audience the environment admits and its provider registration settings. */
export type AuthProjectAudienceBinding = {
    audience: string;
    publicClient: boolean;
    redirectUris: string[] | null;
    postLogoutRedirectUris: string[] | null;
    allowedOrigins: string[] | null;
};
/** One profile field's policy inside the environment's desired state. */
export type AuthProjectProfileField = {
    key: string;
    required: boolean;
    visibleToApplication: boolean;
    editableBy: string;
};
/**
 * The environment configuration an apply writes. A consumer builds it from these
 * fields alone: `audiences` carries the audience binding, and the remaining
 * fields carry the rest. The legal scalar vocabularies are read from the
 * environment's capability operation, not fixed here.
 */
export type AuthProjectDesiredState = {
    identityMode: AuthProjectIdentityMode;
    registrationPolicy: string;
    loginPaused: boolean;
    audiences: AuthProjectAudienceBinding[] | null;
    profileFields: AuthProjectProfileField[] | null;
};
/**
 * Body of both the apply and preview operations. `expectedRevision` is the
 * revision the caller read; Custd refuses an apply when the stored revision has
 * moved.
 */
export type AuthProjectDesiredStateRequest = {
    desiredState: AuthProjectDesiredState;
    expectedRevision: number;
};
/** The receipt an apply returns. */
export type AuthProjectOperation = {
    id: string;
    kind: string;
    status: string;
    revision: number;
    idempotencyKey: string;
    appliedAt: string;
    /** The same body and Idempotency-Key returned the original operation. */
    replayed: boolean;
};
/** One field-level change a preview reports. */
export type AuthProjectChange = {
    field: string;
    before: string;
    after: string;
};
/** The field-level change set an apply would write. A preview writes nothing. */
export type AuthProjectPreview = {
    projectId: string;
    environmentId: string;
    revision: number;
    changes: AuthProjectChange[] | null;
    sideEffects: string[] | null;
    noOp: boolean;
};
/**
 * One audience's provider registration read back from status. `clientId` is the
 * derived `custd-app-<environmentId>-<audienceSlug>` the binding resolves to.
 */
export type AuthProjectClientRegistration = {
    audience: string;
    clientId: string;
    observed: boolean;
};
/** The registration half of status: the provider clients Custd is known to hold. */
export type AuthProjectClientSync = {
    clientIds: string[] | null;
    revision: number;
    checkedAt: string;
    current: boolean;
    registrations: AuthProjectClientRegistration[] | null;
    issuer?: string;
    errorCategory?: string;
};
/**
 * The environment's configured state and applied revision. `desired.audiences`
 * is the audience binding the caller applied, so the
 * project/environment/audience mapping is readable here after an apply.
 * `reconciled` describes the configuration and `loginReady` describes
 * execution; neither is inferred from the other. `clientSync` is absent until
 * registration has run.
 */
export type AuthProjectStatus = {
    projectId: string;
    environmentId: string;
    revision: number;
    desired: AuthProjectDesiredState;
    reconciled: boolean;
    reconcileNote: string;
    loginReady: boolean;
    loginNote: string;
    clientSync?: AuthProjectClientSync;
};
/** One directory credential-store action Custd defines. */
export type AuthProjectDirectoryAction = "enable" | "pause" | "resume" | "release";
/**
 * The configured modes one environment may use, so a caller can show
 * unavailable options honestly rather than offering them. The legal
 * vocabularies are server-owned and surfaced unchanged.
 */
export type AuthProjectCapability = {
    identityModes: string[] | null;
    registrationPolicies: string[] | null;
    profileFieldKeys: string[] | null;
    audienceConstraints: string;
    subjectUniqueness: string;
};
/** One directory's credential-store state as reported. */
export type AuthProjectDirectoryView = {
    poolId: string;
    poolSlug: string;
    state: string;
    slotRef?: string;
    runtimePublicUrl?: string;
    revision: number;
    attemptCount: number;
    lastErrorCategory?: string;
    readyAt?: string;
};
/**
 * The deployment's declared credential-store pool. The pool is deployment-wide,
 * so every environment's report carries the same numbers.
 */
export type AuthProjectDirectoryCapacity = {
    declared: number;
    inUse: number;
    free: number;
};
/**
 * The environment's identity directories and their credential-store readiness.
 * `ready` is true only when every directory that has a store row is serving.
 */
export type AuthProjectDirectoryStatus = {
    projectId: string;
    environmentId: string;
    revision: number;
    directories: AuthProjectDirectoryView[] | null;
    ready: boolean;
    capacity: AuthProjectDirectoryCapacity;
};
/** Body of a directory action. It cannot name a store, runtime URL or state. */
export type AuthProjectDirectoryRequest = {
    poolId: string;
    expectedRevision: number;
};
/** One organisation an environment's directory holds. It carries no member data. */
export type AuthProjectEnvironmentOrganisation = {
    organisationId: string;
    slug: string;
    name: string;
    identityPoolId: string;
};
/** The named list an environment's organisation read answers with. */
export type AuthProjectEnvironmentOrganisationList = {
    projectId: string;
    environmentId: string;
    organisations: AuthProjectEnvironmentOrganisation[] | null;
};
/** Body of clients/reconcile: the revision the caller read. */
export type AuthProjectClientSyncRequest = {
    expectedRevision: number;
};
/** One audience's reconcile outcome, reporting what the provider was observed to hold. */
export type AuthProjectClientSyncRegistration = {
    audience: string;
    clientId: string;
    action: string;
    reason?: string;
};
/**
 * One reconcile's outcome. `superseded` reports that the environment's
 * configuration moved while this run was writing.
 */
export type AuthProjectClientSyncReport = {
    environmentId: string;
    revision: number;
    checkedAt: string;
    errorCategory?: string;
    superseded: boolean;
    clients: AuthProjectClientSyncRegistration[] | null;
};
/** One invitation as a caller sees it. It never carries the token or its hash. */
export type AuthProjectInvitation = {
    invitationId: string;
    email: string;
    membershipRole: string;
    poolId: string;
    organisationId: string;
    expiresAt: string;
    createdAt: string;
    /** open, accepted, revoked or expired. */
    state: string;
    /** Only meaningful on the response to issuing an invitation; absent elsewhere. */
    delivered?: boolean;
};
/** Body of POST .../invitations. It cannot name a project, environment, token or state. */
export type AuthProjectInvitationIssueRequest = {
    poolId: string;
    organisationId: string;
    email: string;
    membershipRole: string;
    expiresInSeconds: number;
};
/** Response to issuing one invitation; `inviteUrl` is returned exactly once. */
export type AuthProjectInvitationIssued = {
    invitation: AuthProjectInvitation;
    inviteUrl: string;
    replayed: boolean;
};
/** An environment's invitations, newest first. */
export type AuthProjectInvitationListResponse = {
    invitations: AuthProjectInvitation[] | null;
};
/** Body of POST .../invitations/revoke. */
export type AuthProjectInvitationRevocationRequest = {
    invitationId: string;
};
/** Body of POST .../invitations/redeliver. It cannot carry a link. */
export type AuthProjectInvitationRedeliveryRequest = {
    invitationId: string;
};
/** One field of a principal's profile as the policy discloses it. */
export type ApplicationProfileField = {
    fieldKey: string;
    value?: string;
    present: boolean;
    required: boolean;
    editableBy: string;
    editable: boolean;
};
/**
 * One principal's profile. It carries only the fields the policy marks visible
 * and names required fields with no stored value as `missingRequired`.
 */
export type ApplicationPrincipalProfile = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    fields: ApplicationProfileField[] | null;
    missingRequired: string[] | null;
};
/** One field value a caller asks to store. */
export type ApplicationProfileValue = {
    fieldKey: string;
    value: string;
};
/** Body of POST .../profile. The boundary comes from the address, not the body. */
export type ApplicationProfileValuesRequest = {
    values: ApplicationProfileValue[];
};
/** One organisation an application principal may act for, with its role there. */
export type ApplicationMembershipChoice = {
    organisationId: string;
    organisationSlug: string;
    organisationName: string;
    role: string;
};
/** The set of organisations one application principal may act for. */
export type ApplicationMembershipContext = {
    projectId: string;
    environmentId: string;
    directoryId: string;
    principalId: string;
    memberships: ApplicationMembershipChoice[] | null;
};
/**
 * Body of POST /auth-projects/{projectId}/delete. `confirmSlug` must equal the
 * stored project slug exactly.
 */
export type AuthProjectDeletionRequest = {
    confirmSlug: string;
};
/** What deleting a project released, grouped so the receipt documents the cascade. */
export type AuthProjectReleasedResources = {
    environments: number;
    directories: number;
    organisations: number;
    memberships: number;
    invitations: number;
    audienceBindings: number;
    operations: number;
};
/** The receipt for a deleted project. */
export type AuthProjectDeletion = {
    projectId: string;
    slug: string;
    name: string;
    released: AuthProjectReleasedResources;
};
/**
 * Body of POST .../environments/{environmentId}/delete. `confirmSlug` must equal
 * the stored environment slug exactly.
 */
export type AuthProjectEnvironmentDeletionRequest = {
    confirmSlug: string;
};
/** What deleting one environment released, grouped for the receipt. */
export type AuthProjectEnvironmentReleasedResources = {
    directories: number;
    organisations: number;
    memberships: number;
    invitations: number;
    audienceBindings: number;
    operations: number;
    profileValues: number;
};
/** The receipt for a deleted environment; it names both project and environment. */
export type AuthProjectEnvironmentDeletion = {
    projectId: string;
    projectSlug: string;
    environmentId: string;
    slug: string;
    name: string;
    released: AuthProjectEnvironmentReleasedResources;
};
/**
 * Body of POST .../environments/{environmentId}/offboard. `confirmSlug` must equal
 * the stored environment slug exactly.
 */
export type AuthProjectEnvironmentOffboardRequest = {
    confirmSlug: string;
};
/** The provider half of one offboard; `status` is complete, pending or unavailable. */
export type AuthEnvironmentClientCleanup = {
    status: string;
    clientsRemoved: number;
    errorCategory?: string;
};
/** What an offboard kept, so the receipt states plainly that nothing was destroyed. */
export type AuthEnvironmentRetainedResources = {
    directories: number;
    organisations: number;
    memberships: number;
    invitations: number;
    profileValues: number;
    reservedSlots: number;
};
/**
 * The receipt for one offboarded environment: its authority is withdrawn and its
 * owned provider clients reconciled away, while the environment and its identity
 * data are retained.
 */
export type AuthProjectEnvironmentOffboarding = {
    projectId: string;
    projectSlug: string;
    environmentId: string;
    slug: string;
    name: string;
    authorityWithdrawn: boolean;
    loginPaused: boolean;
    revision: number;
    clientCleanup: AuthEnvironmentClientCleanup;
    retained: AuthEnvironmentRetainedResources;
};
/**
 * One step of a realm provision, reported so a caller knows where it stopped.
 * The names match the service's ordering: the apply's implicit registration is
 * re-reconciled after the directory enable moves the authority revision.
 */
export type AuthProjectRealmStep = "apply" | "directory_enable" | "client_reconcile" | "status";
/**
 * One environment's realm setup: the state to apply and the directory to enable.
 * It carries no directory revision: the directory enable must name the revision
 * the apply produced, which the helper derives rather than trusting a caller.
 */
export type AuthProjectRealmProvisionRequest = {
    desiredStateRequest: AuthProjectDesiredStateRequest;
    directoryPoolId: string;
};
/**
 * What a realm provision wrote and, on failure, which step failed. Completed
 * steps are always kept so a caller can resume from `failedStep`.
 */
export type AuthProjectRealmProvisionReceipt = {
    projectId: string;
    environmentId: string;
    apply?: AuthProjectOperation;
    directory?: AuthProjectOperation;
    reconcile?: AuthProjectClientSyncReport;
    status?: AuthProjectStatus;
    /** Empty only when every step completed and the realm converged. */
    failedStep?: AuthProjectRealmStep;
};
/**
 * Raised when every step ran but the provider registrations are not known to
 * describe the environment's current configuration: the honest answer for a
 * provision that is not finished, rather than a success whose status is
 * visibly unreconciled.
 */
export declare class AuthProjectRealmNotConvergedError extends Error {
    readonly reconcileNote: string;
    constructor(reconcileNote: string);
}
/**
 * Raised when a realm provision stops early. It carries the failed step and the
 * receipt of every step that completed.
 */
export declare class AuthProjectRealmProvisionError extends Error {
    readonly failedStep: AuthProjectRealmStep;
    readonly receipt: AuthProjectRealmProvisionReceipt;
    readonly cause?: unknown;
    constructor(failedStep: AuthProjectRealmStep, receipt: AuthProjectRealmProvisionReceipt, cause?: unknown);
}
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class AuthProjectAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /**
     * List up to 100 environments the named owning user owns or operates. Pass the
     * previous page's `nextAfter` as `after` for the next page.
     */
    listProjects(after?: string, options?: RequestOptions): Promise<AuthProjectListResponse>;
    /** Create the named owning user's project ownership, identity pool and first paused environment. */
    createProject(body: AuthProjectCreateRequest, options?: RequestOptions): Promise<AuthProjectCreation>;
    /** Add a further environment to an existing project. The new environment starts paused. */
    createEnvironment(projectId: string, body: AuthProjectEnvironmentCreateRequest, options?: RequestOptions): Promise<AuthProjectSummary>;
    /** Report the sessions the directory currently holds for one application principal. */
    listPrincipalSessions(projectId: string, environmentId: string, directoryId: string, providerSubject: string, options?: RequestOptions): Promise<ApplicationSessionInventory>;
    /** End exactly one of a principal's sessions, leaving its other sessions untouched. */
    revokePrincipalSession(projectId: string, environmentId: string, directoryId: string, providerSubject: string, body: ApplicationSessionRevokeRequest, options?: RequestOptions): Promise<ApplicationSessionRevocation>;
    /** End every session the directory holds for one application principal. */
    revokePrincipalSessions(projectId: string, environmentId: string, directoryId: string, providerSubject: string, body: ApplicationSessionsRevokeAllRequest, options?: RequestOptions): Promise<ApplicationSessionRevocation>;
    /** Withdraw authority and revoke the sessions of every identity owned by this principal. */
    suspendPrincipal(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationPrincipalSuspension>;
    /** Restore authority without changing factors; a pending erasure cannot be restored. */
    restorePrincipal(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationPrincipalSuspension>;
    /** Read the portable public record and its provider-trait completeness status. */
    exportPrincipal(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationPrincipalExport>;
    /** Erase the complete principal-owned mapping set through the server's durable operation. */
    erasePrincipal(target: ApplicationPrincipalTarget, body: ApplicationPrincipalErasureRequest, options?: RequestOptions): Promise<ApplicationPrincipalErasure>;
    /** End one application identity's membership of one organisation. */
    revokePrincipalMembership(projectId: string, environmentId: string, directoryId: string, providerSubject: string, body: ApplicationMembershipRevokeRequest, options?: RequestOptions): Promise<ApplicationMembershipRevocation>;
    /**
     * Write the environment's desired state and return the operation receipt.
     * Custd makes it retry-safe per Idempotency-Key, so the key is required. The
     * audience binding the consumer's edge admits against is written here and read
     * back through `getEnvironmentStatus`.
     */
    applyEnvironmentDesiredState(projectId: string, environmentId: string, body: AuthProjectDesiredStateRequest, options?: RequestOptions): Promise<AuthProjectOperation>;
    /** Report the field-level changes an apply would make. A preview writes nothing. */
    previewEnvironmentDesiredState(projectId: string, environmentId: string, body: AuthProjectDesiredStateRequest, options?: RequestOptions): Promise<AuthProjectPreview>;
    /**
     * Read the environment's configured state and applied revision. `status.desired.audiences`
     * carries the applied audience binding and `status.environmentId` the
     * environment binding, so a caller reads the mapping back here after an apply.
     */
    getEnvironmentStatus(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectStatus>;
    /** Read the environment's supported auth configuration. */
    getEnvironmentCapability(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectCapability>;
    /** Report every directory in the environment and whether it is fully stored. */
    listDirectories(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDirectoryStatus>;
    /** Enable, pause, resume or release one directory credential store. */
    actOnDirectory(projectId: string, environmentId: string, action: AuthProjectDirectoryAction, body: AuthProjectDirectoryRequest, options?: RequestOptions): Promise<AuthProjectOperation>;
    /** Report the organisations one environment's directory holds. */
    listEnvironmentOrganisations(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectEnvironmentOrganisationList>;
    /** Register the environment's application clients with the provider. */
    reconcileEnvironmentClients(projectId: string, environmentId: string, body: AuthProjectClientSyncRequest, options?: RequestOptions): Promise<AuthProjectClientSyncReport>;
    /** Report the environment's invitations, newest first. */
    listInvitations(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectInvitationListResponse>;
    /** Invite one address into a directory and return the one-time link. */
    issueInvitation(projectId: string, environmentId: string, body: AuthProjectInvitationIssueRequest, options?: RequestOptions): Promise<AuthProjectInvitationIssued>;
    /** Withdraw a live invitation before it is used. */
    revokeInvitation(projectId: string, environmentId: string, body: AuthProjectInvitationRevocationRequest, options?: RequestOptions): Promise<AuthProjectInvitation>;
    /** Replace one live invitation's link and return the fresh one-time link. */
    redeliverInvitation(projectId: string, environmentId: string, body: AuthProjectInvitationRedeliveryRequest, options?: RequestOptions): Promise<AuthProjectInvitationIssued>;
    /** Read one application principal's profile values. */
    getPrincipalProfile(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationPrincipalProfile>;
    /** Set one application principal's profile values as an upsert. */
    setPrincipalProfile(target: ApplicationPrincipalTarget, body: ApplicationProfileValuesRequest, options?: RequestOptions): Promise<ApplicationPrincipalProfile>;
    /** List the organisations one application principal may act for. */
    listPrincipalMemberships(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationMembershipContext>;
    /** Delete a project and everything scoped to it. `confirmSlug` must name the stored project slug. */
    deleteProject(projectId: string, body: AuthProjectDeletionRequest, options?: RequestOptions): Promise<AuthProjectDeletion>;
    /** Delete one environment without touching its siblings. `confirmSlug` must name the stored environment slug. */
    deleteEnvironment(projectId: string, environmentId: string, body: AuthProjectEnvironmentDeletionRequest, options?: RequestOptions): Promise<AuthProjectEnvironmentDeletion>;
    /**
     * Withdraw one environment's authority and reconcile its owned provider clients
     * away while retaining the environment and its identity data. It is the safe step
     * for an environment whose directory still holds a credential store, which a
     * physical delete refuses. `confirmSlug` must name the stored environment slug.
     * The route has no idempotency key: a retry resumes the provider stage.
     */
    offboardEnvironment(projectId: string, environmentId: string, body: AuthProjectEnvironmentOffboardRequest, options?: RequestOptions): Promise<AuthProjectEnvironmentOffboarding>;
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
    provisionRealm(projectId: string, environmentId: string, request: AuthProjectRealmProvisionRequest, options?: RequestOptions): Promise<AuthProjectRealmProvisionReceipt>;
}
export {};
