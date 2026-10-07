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
    /** End one application identity's membership of one organisation. */
    revokePrincipalMembership(projectId: string, environmentId: string, directoryId: string, providerSubject: string, body: ApplicationMembershipRevokeRequest, options?: RequestOptions): Promise<ApplicationMembershipRevocation>;
}
export {};
