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
}

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
