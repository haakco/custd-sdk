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
  role: string;
  createdAt: string;
  removedAt?: string;
};

export type ApplicationPrincipalProfileValueView = { fieldKey: string; value: string };
export type ApplicationIdentityTraitValue =
  | string
  | number
  | boolean
  | null
  | ApplicationIdentityTraitValue[]
  | { [name: string]: ApplicationIdentityTraitValue };

export type ApplicationIdentityTrait = { name: string; value: ApplicationIdentityTraitValue };
export type ApplicationIdentityTraitsStatus =
  | "included"
  | "incomplete"
  | "identity_absent"
  | "directory_unavailable"
  | "provider_unreadable";

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
export type ApplicationPrincipalErasureRequest = { confirm: true };

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
  /** Persisted company of this environment's project; null means explicitly unbound, never inferred. */
  companyUuid: string | null;
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
export type AuthProjectDirectoryCapacity = { declared: number; inUse: number; free: number };

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
export type AuthProjectDirectoryRequest = { poolId: string; expectedRevision: number };

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
export type AuthProjectClientSyncRequest = { expectedRevision: number };

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
export type AuthProjectInvitationListResponse = { invitations: AuthProjectInvitation[] | null };

/** Body of POST .../invitations/revoke. */
export type AuthProjectInvitationRevocationRequest = { invitationId: string };

/** Body of POST .../invitations/redeliver. It cannot carry a link. */
export type AuthProjectInvitationRedeliveryRequest = { invitationId: string };

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
export type ApplicationProfileValue = { fieldKey: string; value: string };

/** Body of POST .../profile. The boundary comes from the address, not the body. */
export type ApplicationProfileValuesRequest = { values: ApplicationProfileValue[] };

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
export type AuthProjectDeletionRequest = { confirmSlug: string };

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
export type AuthProjectEnvironmentDeletionRequest = { confirmSlug: string };

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
export type AuthProjectEnvironmentOffboardRequest = { confirmSlug: string };

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
export class AuthProjectRealmNotConvergedError extends Error {
  constructor(readonly reconcileNote: string) {
    super(`custd: auth-project realm did not converge${reconcileNote ? `: ${reconcileNote}` : ""}`);
    this.name = "AuthProjectRealmNotConvergedError";
  }
}

/**
 * Raised when a realm provision stops early. It carries the failed step and the
 * receipt of every step that completed.
 */
export class AuthProjectRealmProvisionError extends Error {
  readonly cause?: unknown;

  constructor(
    readonly failedStep: AuthProjectRealmStep,
    readonly receipt: AuthProjectRealmProvisionReceipt,
    cause?: unknown,
  ) {
    super(`custd: realm provision failed at step ${failedStep}`);
    this.name = "AuthProjectRealmProvisionError";
    this.cause = cause;
  }
}

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class AuthProjectAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /**
   * List up to 100 environments the named owning user owns or operates. Pass the
   * previous page's `nextAfter` as `after` for the next page.
   */
  listProjects(after?: string, options?: RequestOptions): Promise<AuthProjectListResponse> {
    const cursor = after === undefined ? "" : after.trim();
    const path = cursor === "" ? "/auth-projects" : `/auth-projects?after=${encodeURIComponent(cursor)}`;
    return this.request<AuthProjectListResponse>("GET", path, undefined, options);
  }

  /** Create the named owning user's project ownership, identity pool and first paused environment. */
  async createProject(body: AuthProjectCreateRequest, options?: RequestOptions): Promise<AuthProjectCreation> {
    return this.request<AuthProjectCreation>("POST", "/auth-projects", body, requireIdempotencyKey(options));
  }

  /**
   * Record the authenticated human owner's company on an explicitly unbound historical project.
   *
   * It is the actionable step a `company_binding_required` refusal names: the body is empty, Custd
   * refuses a machine credential and a foreign rebind, and repeating it for the same company is
   * safe, so it carries no idempotency key.
   */
  bindProjectCompany(projectId: string, options?: RequestOptions): Promise<AuthProjectCompanyBinding> {
    const path = `/auth-projects/${encodeURIComponent(projectId)}/company-binding`;
    return this.request<AuthProjectCompanyBinding>("POST", path, undefined, options);
  }

  /** Add a further environment to an existing project. The new environment starts paused. */
  createEnvironment(
    projectId: string,
    body: AuthProjectEnvironmentCreateRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectSummary> {
    const path = `/auth-projects/${encodeURIComponent(projectId)}/environments`;
    return this.request<AuthProjectSummary>("POST", path, body, options);
  }

  /** Report the sessions the directory currently holds for one application principal. */
  listPrincipalSessions(
    projectId: string,
    environmentId: string,
    directoryId: string,
    providerSubject: string,
    options?: RequestOptions,
  ): Promise<ApplicationSessionInventory> {
    const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions`;
    return this.request<ApplicationSessionInventory>("GET", path, undefined, options);
  }

  /** End exactly one of a principal's sessions, leaving its other sessions untouched. */
  async revokePrincipalSession(
    projectId: string,
    environmentId: string,
    directoryId: string,
    providerSubject: string,
    body: ApplicationSessionRevokeRequest,
    options?: RequestOptions,
  ): Promise<ApplicationSessionRevocation> {
    const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions/revoke`;
    return this.request<ApplicationSessionRevocation>("POST", path, body, requireIdempotencyKey(options));
  }

  /** End every session the directory holds for one application principal. */
  async revokePrincipalSessions(
    projectId: string,
    environmentId: string,
    directoryId: string,
    providerSubject: string,
    body: ApplicationSessionsRevokeAllRequest,
    options?: RequestOptions,
  ): Promise<ApplicationSessionRevocation> {
    const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/sessions/revoke-all`;
    return this.request<ApplicationSessionRevocation>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Withdraw authority and revoke the sessions of every identity owned by this principal. */
  async suspendPrincipal(
    target: ApplicationPrincipalTarget,
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalSuspension> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/suspend`;
    return this.request<ApplicationPrincipalSuspension>("POST", path, undefined, requireIdempotencyKey(options));
  }

  /** Restore authority without changing factors; a pending erasure cannot be restored. */
  async restorePrincipal(
    target: ApplicationPrincipalTarget,
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalSuspension> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/restore`;
    return this.request<ApplicationPrincipalSuspension>("POST", path, undefined, requireIdempotencyKey(options));
  }

  /** Read the portable public record and its provider-trait completeness status. */
  exportPrincipal(target: ApplicationPrincipalTarget, options?: RequestOptions): Promise<ApplicationPrincipalExport> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/export`;
    return this.request<ApplicationPrincipalExport>("GET", path, undefined, options);
  }

  /** Erase the complete principal-owned mapping set through the server's durable operation. */
  async erasePrincipal(
    target: ApplicationPrincipalTarget,
    body: ApplicationPrincipalErasureRequest,
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalErasure> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/erase`;
    return this.request<ApplicationPrincipalErasure>("POST", path, body, requireIdempotencyKey(options));
  }

  /** End one application identity's membership of one organisation. */
  revokePrincipalMembership(
    projectId: string,
    environmentId: string,
    directoryId: string,
    providerSubject: string,
    body: ApplicationMembershipRevokeRequest,
    options?: RequestOptions,
  ): Promise<ApplicationMembershipRevocation> {
    const path = `${applicationPrincipalPath(projectId, environmentId, directoryId, providerSubject)}/memberships/revoke`;
    return this.request<ApplicationMembershipRevocation>("POST", path, body, options);
  }

  /**
   * Write the environment's desired state and return the operation receipt.
   * Custd makes it retry-safe per Idempotency-Key, so the key is required. The
   * audience binding the consumer's edge admits against is written here and read
   * back through `getEnvironmentStatus`.
   */
  async applyEnvironmentDesiredState(
    projectId: string,
    environmentId: string,
    body: AuthProjectDesiredStateRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectOperation> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/apply`;
    return this.request<AuthProjectOperation>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Report the field-level changes an apply would make. A preview writes nothing. */
  previewEnvironmentDesiredState(
    projectId: string,
    environmentId: string,
    body: AuthProjectDesiredStateRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectPreview> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/preview`;
    return this.request<AuthProjectPreview>("POST", path, body, options);
  }

  /**
   * Read the environment's configured state and applied revision. `status.desired.audiences`
   * carries the applied audience binding and `status.environmentId` the
   * environment binding, so a caller reads the mapping back here after an apply.
   */
  getEnvironmentStatus(projectId: string, environmentId: string, options?: RequestOptions): Promise<AuthProjectStatus> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/status`;
    return this.request<AuthProjectStatus>("GET", path, undefined, options);
  }

  /** Read the environment's supported auth configuration. */
  getEnvironmentCapability(
    projectId: string,
    environmentId: string,
    options?: RequestOptions,
  ): Promise<AuthProjectCapability> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/capability`;
    return this.request<AuthProjectCapability>("GET", path, undefined, options);
  }

  /** Report every directory in the environment and whether it is fully stored. */
  listDirectories(
    projectId: string,
    environmentId: string,
    options?: RequestOptions,
  ): Promise<AuthProjectDirectoryStatus> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/directories`;
    return this.request<AuthProjectDirectoryStatus>("GET", path, undefined, options);
  }

  /** Enable, pause, resume or release one directory credential store. */
  async actOnDirectory(
    projectId: string,
    environmentId: string,
    action: AuthProjectDirectoryAction,
    body: AuthProjectDirectoryRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectOperation> {
    if (!directoryActions.includes(action)) {
      throw new Error(
        `custd: auth-project directory action ${String(action)} is not one of enable, pause, resume or release`,
      );
    }
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/directories/${encodeURIComponent(action)}`;
    return this.request<AuthProjectOperation>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Report the organisations one environment's directory holds. */
  listEnvironmentOrganisations(
    projectId: string,
    environmentId: string,
    options?: RequestOptions,
  ): Promise<AuthProjectEnvironmentOrganisationList> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/organisations`;
    return this.request<AuthProjectEnvironmentOrganisationList>("GET", path, undefined, options);
  }

  /**
   * List the application principals every directory in the environment holds. The
   * owning-user header is taken from `options` like the other project-auth reads,
   * and paging continues with the opaque `nextCursor` the previous page returned.
   */
  listPrincipals(
    projectId: string,
    environmentId: string,
    query: ApplicationPrincipalListQuery = {},
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalListResponse> {
    const parts: string[] = [];
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
    return this.request<ApplicationPrincipalListResponse>("GET", path, undefined, options);
  }

  /** Register the environment's application clients with the provider. */
  async reconcileEnvironmentClients(
    projectId: string,
    environmentId: string,
    body: AuthProjectClientSyncRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectClientSyncReport> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/clients/reconcile`;
    return this.request<AuthProjectClientSyncReport>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Report the environment's invitations, newest first. */
  listInvitations(
    projectId: string,
    environmentId: string,
    options?: RequestOptions,
  ): Promise<AuthProjectInvitationListResponse> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations`;
    return this.request<AuthProjectInvitationListResponse>("GET", path, undefined, options);
  }

  /** Invite one address into a directory and return the one-time link. */
  async issueInvitation(
    projectId: string,
    environmentId: string,
    body: AuthProjectInvitationIssueRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectInvitationIssued> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations`;
    return this.request<AuthProjectInvitationIssued>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Withdraw a live invitation before it is used. */
  async revokeInvitation(
    projectId: string,
    environmentId: string,
    body: AuthProjectInvitationRevocationRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectInvitation> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations/revoke`;
    return this.request<AuthProjectInvitation>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Replace one live invitation's link and return the fresh one-time link. */
  async redeliverInvitation(
    projectId: string,
    environmentId: string,
    body: AuthProjectInvitationRedeliveryRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectInvitationIssued> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/invitations/redeliver`;
    return this.request<AuthProjectInvitationIssued>("POST", path, body, requireIdempotencyKey(options));
  }

  /** Read one application principal's profile values. */
  getPrincipalProfile(
    target: ApplicationPrincipalTarget,
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalProfile> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/profile`;
    return this.request<ApplicationPrincipalProfile>("GET", path, undefined, options);
  }

  /** Set one application principal's profile values as an upsert. */
  async setPrincipalProfile(
    target: ApplicationPrincipalTarget,
    body: ApplicationProfileValuesRequest,
    options?: RequestOptions,
  ): Promise<ApplicationPrincipalProfile> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/profile`;
    return this.request<ApplicationPrincipalProfile>("POST", path, body, requireIdempotencyKey(options));
  }

  /** List the organisations one application principal may act for. */
  listPrincipalMemberships(
    target: ApplicationPrincipalTarget,
    options?: RequestOptions,
  ): Promise<ApplicationMembershipContext> {
    const path = `${applicationPrincipalPath(target.projectId, target.environmentId, target.directoryId, target.providerSubject)}/memberships`;
    return this.request<ApplicationMembershipContext>("GET", path, undefined, options);
  }

  /** Delete a project and everything scoped to it. `confirmSlug` must name the stored project slug. */
  deleteProject(
    projectId: string,
    body: AuthProjectDeletionRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectDeletion> {
    const path = `/auth-projects/${encodeURIComponent(projectId)}/delete`;
    return this.request<AuthProjectDeletion>("POST", path, body, options);
  }

  /** Delete one environment without touching its siblings. `confirmSlug` must name the stored environment slug. */
  deleteEnvironment(
    projectId: string,
    environmentId: string,
    body: AuthProjectEnvironmentDeletionRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectEnvironmentDeletion> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/delete`;
    return this.request<AuthProjectEnvironmentDeletion>("POST", path, body, options);
  }

  /**
   * Withdraw one environment's authority and reconcile its owned provider clients
   * away while retaining the environment and its identity data. It is the safe step
   * for an environment whose directory still holds a credential store, which a
   * physical delete refuses. `confirmSlug` must name the stored environment slug.
   * The route has no idempotency key: a retry resumes the provider stage.
   */
  offboardEnvironment(
    projectId: string,
    environmentId: string,
    body: AuthProjectEnvironmentOffboardRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectEnvironmentOffboarding> {
    const path = `${environmentDesiredStatePath(projectId, environmentId)}/offboard`;
    return this.request<AuthProjectEnvironmentOffboarding>("POST", path, body, options);
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
  async provisionRealm(
    projectId: string,
    environmentId: string,
    request: AuthProjectRealmProvisionRequest,
    options?: RequestOptions,
  ): Promise<AuthProjectRealmProvisionReceipt> {
    const base = requireRealmBaseKey(options);
    const receipt: AuthProjectRealmProvisionReceipt = { projectId, environmentId };

    let apply: AuthProjectOperation;
    try {
      apply = await this.applyEnvironmentDesiredState(projectId, environmentId, request.desiredStateRequest, {
        ...options,
        idempotencyKey: `${base}:apply`,
      });
    } catch (error) {
      receipt.failedStep = "apply";
      throw new AuthProjectRealmProvisionError("apply", receipt, error);
    }
    receipt.apply = apply;

    // The enable names the revision the apply committed. The service compares the
    // expected revision against the environment's current revision, which the apply
    // just advanced, so the caller's read must not be reused here.
    let directory: AuthProjectOperation;
    try {
      directory = await this.actOnDirectory(
        projectId,
        environmentId,
        "enable",
        { poolId: request.directoryPoolId, expectedRevision: apply.revision },
        { ...options, idempotencyKey: `${base}:directory-enable` },
      );
    } catch (error) {
      receipt.failedStep = "directory_enable";
      throw new AuthProjectRealmProvisionError("directory_enable", receipt, error);
    }
    receipt.directory = directory;

    // Enabling advanced the revision again, so the observation the apply recorded is
    // behind the environment. Reconcile at the directory's revision to record the
    // provider state that describes the configuration as it is now.
    let reconcile: AuthProjectClientSyncReport;
    try {
      reconcile = await this.reconcileEnvironmentClients(
        projectId,
        environmentId,
        { expectedRevision: directory.revision },
        { ...options, idempotencyKey: `${base}:client-reconcile` },
      );
    } catch (error) {
      receipt.failedStep = "client_reconcile";
      throw new AuthProjectRealmProvisionError("client_reconcile", receipt, error);
    }
    receipt.reconcile = reconcile;

    // Status is a read, so it does not carry the workflow's write key.
    let status: AuthProjectStatus;
    try {
      status = await this.getEnvironmentStatus(projectId, environmentId, {
        ...options,
        idempotencyKey: undefined,
      });
    } catch (error) {
      receipt.failedStep = "status";
      throw new AuthProjectRealmProvisionError("status", receipt, error);
    }
    receipt.status = status;
    if (!status.reconciled) {
      receipt.failedStep = "status";
      throw new AuthProjectRealmProvisionError(
        "status",
        receipt,
        new AuthProjectRealmNotConvergedError(status.reconcileNote),
      );
    }

    return receipt;
  }
}

/** One directory credential-store action Custd defines. */
const directoryActions: readonly AuthProjectDirectoryAction[] = ["enable", "pause", "resume", "release"];

// environmentDesiredStatePath addresses one environment under one project. Every
// segment is escaped so a caller-supplied identifier cannot reshape the path.
function environmentDesiredStatePath(projectId: string, environmentId: string): string {
  return `/auth-projects/${encodeURIComponent(projectId)}` + `/environments/${encodeURIComponent(environmentId)}`;
}

// applicationPrincipalPath addresses one application principal inside one
// directory. Every segment is escaped so a caller-supplied identifier cannot
// reshape the path.
function applicationPrincipalPath(
  projectId: string,
  environmentId: string,
  directoryId: string,
  providerSubject: string,
): string {
  return (
    `/auth-projects/${encodeURIComponent(projectId)}` +
    `/environments/${encodeURIComponent(environmentId)}` +
    `/directories/${encodeURIComponent(directoryId)}` +
    `/principals/${encodeURIComponent(providerSubject)}`
  );
}

// requireIdempotencyKey rejects an empty key on the routes Custd makes
// retry-safe, so a caller gets one clear error instead of a service 400.
function requireIdempotencyKey(options: RequestOptions | undefined): RequestOptions {
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
function requireRealmBaseKey(options: RequestOptions | undefined): string {
  const base = options?.idempotencyKey?.trim() ?? "";
  if (base === "") {
    throw new Error("custd: auth-project realm provision requires a base idempotency key");
  }
  if (base.length < realmMinKeyLength) {
    throw new Error(`custd: auth-project realm base idempotency key must be at least ${realmMinKeyLength} characters`);
  }
  const maxBase = realmMaxKeyLength - realmLongestSuffix.length;
  if (base.length > maxBase) {
    throw new Error(
      `custd: auth-project realm base idempotency key must be at most ${maxBase} characters so every per-step key stays within ${realmMaxKeyLength}`,
    );
  }
  return base;
}
