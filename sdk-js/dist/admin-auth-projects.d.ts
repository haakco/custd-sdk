import type { AppRelease, AppReleaseCreateRequest, AppReleaseList, AppReleasePromotion, AppReleaseUploadedFile } from "./admin-app-releases.js";
import { type AppCreateRequest, type AppCreation, type AppDeployCredential, type AppDeployCredentialList, type AppListResponse, type AppOverview, type AppSignInRequest, type AppSummary } from "./admin-apps.js";
import type { AuthProjectAppLinkList, AuthProjectBrandLogo, AuthProjectDomainBinding, AuthProjectDomainBindRequest, AuthProjectDomainImageOverrideRequest, AuthProjectDomainMintRequest } from "./admin-auth-project-domain.js";
import type { RequestOptions } from "./index.js";
/** How an environment's identity boundary is shared. Custd owns both values. */
export type AuthProjectIdentityMode = "isolated" | "shared";
/**
 * How an environment decides which principals an audience admits.
 *
 * "organisation_membership" is the pre-existing behaviour: any live member of the environment's
 * organisation is admitted for every registered audience. "explicit_grants" admits an audience only
 * when the principal holds a grant for that exact audience. The caller must declare it on creation
 * and it cannot be changed afterwards.
 */
export type AuthProjectAudienceEntitlementMode = "organisation_membership" | "explicit_grants";
/** Body of POST /api/v1/admin/auth-projects. */
export type AuthProjectCreateRequest = {
    slug: string;
    name: string;
    environmentSlug: string;
    identityMode: AuthProjectIdentityMode;
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode;
};
/** Body of POST /api/v1/admin/auth-projects/{projectId}/environments. */
export type AuthProjectEnvironmentCreateRequest = {
    slug: string;
    name: string;
    identityMode: AuthProjectIdentityMode;
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode;
};
/** One project and the environment the call is scoped to. */
export type AuthProjectSummary = {
    projectId: string;
    slug: string;
    name: string;
    environmentId: string;
    environmentSlug: string;
    identityMode: AuthProjectIdentityMode;
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode;
    /** Persisted company of this project; null means explicitly unbound, never inferred. */
    companyUuid: string | null;
};
/** Result of binding an explicitly unbound project to the authenticated human owner's company. */
export type AuthProjectCompanyBinding = {
    projectId: string;
    companyUuid: string;
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
/**
 * Query for GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals.
 * `cursor` is the opaque `nextCursor` the previous page returned and is left off when
 * empty. `limit` bounds the page; Custd applies its own default of 100 and maximum of
 * 100, so a positive limit is passed through unchanged.
 */
export type ApplicationPrincipalListQuery = {
    cursor?: string;
    limit?: number;
};
/**
 * One application principal admitted to one directory. `providerSubject` is the
 * opaque management address the principal routes take; `principalId` is the
 * application identity UUID it resolves to.
 */
export type ApplicationPrincipalListItem = {
    principalId: string;
    directoryId: string;
    providerSubject: string;
    enabled: boolean;
};
/** One page of an environment's application principals. */
export type ApplicationPrincipalListResponse = {
    /** Empty, never null, when the environment holds no principals. */
    principals: ApplicationPrincipalListItem[];
    /** Cursor for the next page; absent on the last page. */
    nextCursor?: string;
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
    role: "administrator" | "member" | "viewer";
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
 *
 * The realm fields `loginPaused`, `entryPath`, `brandAccent`, `signInMethods` and
 * `profileFields` follow one rule: leaving a field out, or sending null, keeps the
 * stored value; `""` or `[]` clears it; `loginPaused` true or false sets the pause.
 * A tool that manages only its own sections therefore never wipes the others.
 */
export type AuthProjectDesiredState = {
    identityMode: AuthProjectIdentityMode;
    registrationPolicy: string;
    /** Pauses the realm's sign-in. Leaving it out keeps the stored pause. */
    loginPaused?: boolean | null;
    audiences: AuthProjectAudienceBinding[] | null;
    /** The profile-field policy, replaced in full when sent. Leaving it out keeps it; `[]` clears it. */
    profileFields?: AuthProjectProfileField[] | null;
    /** The realm's public entry path. Leaving it out keeps it; `""` clears it. */
    entryPath?: string | null;
    /** The sign-in accent as #rrggbb. Leaving it out keeps it; `""` restores the shared default. */
    brandAccent?: string | null;
    /** The application name shown on invitations and hosted sign-in; empty when none is chosen. */
    displayName?: string;
    /** Which surface owns the display name: `application` or `hosting`. Provenance, never authority. */
    displayNameSource?: string;
    /** With an empty displayName and a declared source, gives up a name that source set. Never returned. */
    withdrawDisplayName?: boolean;
    /**
     * Narrows the offered sign-in methods. Leaving it out keeps the stored set; `[]` clears it, which
     * offers whatever the credential store can complete.
     */
    signInMethods?: string[] | null;
    /** The remembered-session offer. Leaving it out keeps the stored setting. */
    applicationSessionPolicy?: AuthProjectApplicationSessionPolicy;
    /** The social providers offered. Leaving it out keeps the stored section. */
    socialSignIn?: AuthProjectSocialSignIn;
    /**
     * Serves the environment as a hosted application. Leaving it out keeps the
     * stored section, so an apply cannot switch an app off by omission.
     */
    hosting?: AuthProjectHosting;
};
/**
 * The environment configuration a status reports. It always carries the realm fields an
 * apply may leave out: `entryPath` and `brandAccent` are `""` when unset, and `loginPaused`
 * is false when sign-in is not paused.
 */
export type AuthProjectConfiguredState = AuthProjectDesiredState & {
    loginPaused: boolean;
    profileFields: AuthProjectProfileField[] | null;
    entryPath: string;
    brandAccent: string;
    signInMethods: string[] | null;
};
export type AuthProjectApplicationSessionPolicy = "offer_remember_me" | "short_only";
export type AuthProjectSocialProviderName = "google" | "github";
/** One social provider. `shared` uses Custd's provider app; `own` needs the owner's clientId and, once, its secret. */
export type AuthProjectSocialProvider = {
    provider: AuthProjectSocialProviderName;
    mode: "shared" | "own";
    clientId?: string;
    /** Write-only; leaving it out keeps the stored secret while clientId is unchanged. */
    clientSecret?: string;
    /** Read-only: whether a secret is stored. */
    clientSecretSet?: boolean;
};
/** Read-only: what the sign-in directory offers now, and the callback URLs to register with an own provider app. */
export type AuthProjectSocialSignInStatus = {
    callbackUrls: Array<{
        provider: AuthProjectSocialProviderName;
        url: string;
    }> | null;
    providers: Array<{
        provider: AuthProjectSocialProviderName;
        mode: "shared" | "own";
        state: "active" | "applying" | "unavailable" | "waiting_for_directory";
        note: string;
    }> | null;
};
export type AuthProjectSocialSignIn = {
    providers: AuthProjectSocialProvider[] | null;
    status?: AuthProjectSocialSignInStatus;
};
/** Whether an environment is served as a hosted application. */
export type AuthProjectHostingMode = "disabled" | "enabled";
/** One capability a hosted application turns on; the discovery document lists the enabled ones. */
export type AuthProjectHostingCapability = "tracking" | "error_capture" | "app_data" | "sign_in";
/** The tenant data scope and resource the hosted Site writes to. */
export type AuthProjectHostingIngestTarget = {
    scopeUuid: string;
    resourceUuid: string;
};
/**
 * The environment's application hosting section. The host is not part of it:
 * the server derives it from the project and environment slugs and reports it
 * on `AuthProjectStatus.hosting`. `ingestTarget` is required while enabled.
 */
export type AuthProjectHosting = {
    mode: AuthProjectHostingMode;
    capabilities: AuthProjectHostingCapability[];
    ingestTarget?: AuthProjectHostingIngestTarget;
};
/** The public client a hosted app signs people in with. */
export type AuthProjectHostedSignIn = {
    clientId: string;
    audience: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
};
/** A hosted environment's derived serving identity. `signIn` is absent unless `sign_in` is on. */
export type AuthProjectHostingStatus = {
    host: string;
    origin: string;
    signIn?: AuthProjectHostedSignIn;
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
    desired: AuthProjectConfiguredState;
    reconciled: boolean;
    reconcileNote: string;
    loginReady: boolean;
    loginNote: string;
    clientSync?: AuthProjectClientSync;
    /** Persisted company of this environment's project; null means explicitly unbound, never inferred. */
    companyUuid: string | null;
    companySlug?: string;
    /** The URL of the realm's uploaded logo, absent when it has none. */
    brandLogoUrl?: string;
    /** The derived serving identity of a hosted environment, absent when it is not served. */
    hosting?: AuthProjectHostingStatus;
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
    /** Server-recorded acceptance linkage. Unavailable when absent/null; never infer from email. */
    acceptedPrincipalId?: string | null;
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
/** One audience's admission state; managed means explicit grants are required. */
export type PrincipalAudience = {
    audience: string;
    granted: boolean;
    managed: boolean;
};
export type PrincipalAudiences = {
    audienceEntitlementMode: AuthProjectAudienceEntitlementMode;
    audiences: PrincipalAudience[];
};
/** Directory, organisation and exact registered audience for a grant or revoke. */
export type AudienceGrantRequest = {
    directoryId: string;
    audience: string;
    organisationId: string;
};
export type AudienceGrant = {
    principalId: string;
    organisationId: string;
    audience: string;
    granted: boolean;
    managed: boolean;
};
/** One field of a principal's profile as the policy discloses it. */
export type ApplicationProfileField = {
    fieldKey: string;
    value?: string;
    present: boolean;
    required: boolean;
    editableBy: "user" | "provider" | "administrator";
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
    role: "administrator" | "member" | "viewer";
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
    /** The hosted application data removed from each environment. */
    hosting: AuthProjectHostingRemoval[] | null;
};
/** The hosted application rows removed with one environment. */
export type AuthEnvironmentHostingRemoval = {
    sites: number;
    releases: number;
    releaseObjects: number;
    shareCardObjects: number;
    items: number;
    links: number;
    collectionEntries: number;
    measurementProjects: number;
    meetings: number;
    uncertaintyModels: number;
    requestSummaries: number;
    alertRules: number;
    alertSubscriptions: number;
    alertWebhooks: number;
    alertDeliveries: number;
};
export type AuthProjectHostingRemoval = {
    environmentId: string;
    slug: string;
    removed: AuthEnvironmentHostingRemoval;
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
    hosting: AuthEnvironmentHostingRemoval;
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
    hosting: AuthEnvironmentHostingWithdrawal;
};
/** What offboarding withdrew from a hosted environment; `status` says whether it finished. */
export type AuthEnvironmentHostingWithdrawal = {
    status: string;
    sites: number;
    activeReleases: number;
    alertRules: number;
    alertDeliveries: number;
    errorCategory?: string;
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
    /**
     * Record the authenticated human owner's company on an explicitly unbound historical project.
     *
     * It is the actionable step a `company_binding_required` refusal names: the body is empty, Custd
     * refuses a machine credential and a foreign rebind, and repeating it for the same company is
     * safe, so it carries no idempotency key.
     */
    bindProjectCompany(projectId: string, options?: RequestOptions): Promise<AuthProjectCompanyBinding>;
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
    /** Read the environment's most recent releases. Omit `limit` for the server default (20, capped at 100). */
    listAppReleases(projectId: string, environmentId: string, limit?: number, options?: RequestOptions): Promise<AppReleaseList>;
    /** Record a new, pending release from its manifest. */
    createAppRelease(projectId: string, environmentId: string, body: AppReleaseCreateRequest, options?: RequestOptions): Promise<AppRelease>;
    /**
     * Store one manifest file of a pending release as its raw bytes. The server
     * refuses bytes whose size or sha256 differ from the manifest.
     */
    uploadAppReleaseFile(projectId: string, environmentId: string, releaseId: string, filePath: string, bytes: Uint8Array, options?: RequestOptions): Promise<AppReleaseUploadedFile>;
    /** Read every file back and mark the release verified when all of them match the manifest. */
    verifyAppRelease(projectId: string, environmentId: string, releaseId: string, options?: RequestOptions): Promise<AppRelease>;
    /** Make a verified release the one the environment's host serves. */
    promoteAppRelease(projectId: string, environmentId: string, releaseId: string, options?: RequestOptions): Promise<AppReleasePromotion>;
    /**
     * Create an app with hosting, traffic, error capture and app data on; `signIn` also turns on
     * invite-only sign-in. Repeating the same body and Idempotency-Key finishes a create that did
     * not complete (`app_setup_incomplete`) or reads the same app back, so the key is required.
     */
    createApp(body: AppCreateRequest, options?: RequestOptions): Promise<AppCreation>;
    /** List one page of the caller's apps, worst status first. Pass the previous `nextAfter` as `after`. */
    listApps(after?: string, options?: RequestOptions): Promise<AppListResponse>;
    /** Read one app by its slug, with its latest release and link counts. */
    getApp(slug: string, options?: RequestOptions): Promise<AppOverview>;
    /** Create a CI credential that can deploy only this app, acting for the caller. Its secret is shown once. */
    createAppDeployCredential(slug: string, options?: RequestOptions): Promise<AppDeployCredential>;
    /** List the app's deploy credentials, newest first. */
    listAppDeployCredentials(slug: string, options?: RequestOptions): Promise<AppDeployCredentialList>;
    /** Take the app offline, keeping its releases and data. The Idempotency-Key finishes an incomplete pause. */
    pauseApp(slug: string, options?: RequestOptions): Promise<AppSummary>;
    /** Serve the app again, with its newest verified release when none is active. */
    resumeApp(slug: string, options?: RequestOptions): Promise<AppSummary>;
    /** Retry the app's Site registration and sign-in setup from its saved hosting configuration. */
    repairApp(slug: string, options?: RequestOptions): Promise<AppSummary>;
    /** Change who may sign in to the app. Only the project owner may. */
    setAppSignIn(slug: string, body: AppSignInRequest, options?: RequestOptions): Promise<AppSummary>;
    /** Remove a deploy credential. Repeating a delete that failed part-way finishes it. */
    deleteAppDeployCredential(slug: string, clientId: string, options?: RequestOptions): Promise<void>;
    /** Read the environment's authentication hostname, its state and the DNS records it needs. */
    getEnvironmentAuthDomain(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Reserve a verified hostname for the environment. */
    bindEnvironmentAuthDomain(projectId: string, environmentId: string, body: AuthProjectDomainBindRequest, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Reserve a platform-generated issuer hostname for an installed environment. Operators only. */
    mintEnvironmentAuthDomain(projectId: string, environmentId: string, body: AuthProjectDomainMintRequest, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Claim installed capacity for a reserved realm. A replay returns the same claim. */
    admitEnvironmentAuthDomain(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Ask for the hostname to be reconciled again. */
    retryEnvironmentAuthDomain(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Disable the issuer while keeping the hostname reserved. */
    disableEnvironmentAuthDomain(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Start the cleanup that frees the hostname for a new binding. */
    releaseEnvironmentAuthDomain(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Pin one realm component to an exact incident image until it expires. System operators only. */
    setEnvironmentAuthDomainImageOverride(projectId: string, environmentId: string, body: AuthProjectDomainImageOverrideRequest, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** End the realm's incident image override. */
    clearEnvironmentAuthDomainImageOverride(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDomainBinding>;
    /** Upload or replace the realm's brand logo. The server checks the image format from its bytes. */
    setAuthProjectBrandLogo(projectId: string, environmentId: string, logo: Blob, filename?: string, options?: RequestOptions): Promise<AuthProjectBrandLogo>;
    /** Remove the realm's brand logo. */
    clearAuthProjectBrandLogo(projectId: string, environmentId: string, options?: RequestOptions): Promise<void>;
    /** List the owner and share links to app items in the environment. */
    listEnvironmentAppLinks(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectAppLinkList>;
    private authDomainRequest;
    /** Read the environment's supported auth configuration. */
    getEnvironmentCapability(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectCapability>;
    /** Report every directory in the environment and whether it is fully stored. */
    listDirectories(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectDirectoryStatus>;
    /** Enable, pause, resume or release one directory credential store. */
    actOnDirectory(projectId: string, environmentId: string, action: AuthProjectDirectoryAction, body: AuthProjectDirectoryRequest, options?: RequestOptions): Promise<AuthProjectOperation>;
    /** Report the organisations one environment's directory holds. */
    listEnvironmentOrganisations(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectEnvironmentOrganisationList>;
    /**
     * List the application principals every directory in the environment holds. The
     * owning-user header is taken from `options` like the other project-auth reads,
     * and paging continues with the opaque `nextCursor` the previous page returned.
     */
    listPrincipals(projectId: string, environmentId: string, query?: ApplicationPrincipalListQuery, options?: RequestOptions): Promise<ApplicationPrincipalListResponse>;
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
    /** List admission state for the existing directory/provider-subject address. */
    listPrincipalAudiences(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<PrincipalAudiences>;
    /** Grant exactly one audience; idempotent and audited server-side. */
    grantPrincipalAudience(target: ApplicationPrincipalTarget, body: AudienceGrantRequest, options?: RequestOptions): Promise<AudienceGrant>;
    /** Revoke only this audience, leaving sibling audiences and organisation membership untouched.
     * Idempotent and audited server-side; no replacement audience is required.
     */
    revokePrincipalAudience(target: ApplicationPrincipalTarget, body: AudienceGrantRequest, options?: RequestOptions): Promise<AudienceGrant>;
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
