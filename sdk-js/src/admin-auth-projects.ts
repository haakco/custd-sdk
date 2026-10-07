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
  reason?: string;
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
