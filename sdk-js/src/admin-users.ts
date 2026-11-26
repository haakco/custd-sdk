/**
 * Tenant administrator users and their roles. A user has a global identity state and a
 * per-company membership state, reported separately: disabling an identity and ending a
 * membership are different decisions.
 */

import type { RequestOptions } from "./index.js";

/** The roles a tenant membership can carry. */
export const ADMIN_USER_ROLES = {
  tenantAdmin: "tenant_admin",
  tenantIngestManager: "tenant_ingest_manager",
  tenantAnalyst: "tenant_analyst",
} as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[keyof typeof ADMIN_USER_ROLES];

export const ADMIN_USER_GLOBAL_STATES = { enabled: "enabled", suspended: "suspended" } as const;

export type AdminUserGlobalState = (typeof ADMIN_USER_GLOBAL_STATES)[keyof typeof ADMIN_USER_GLOBAL_STATES];

export const ADMIN_USER_MEMBERSHIP_STATES = { active: "active", ended: "ended" } as const;

export type AdminUserMembershipState = (typeof ADMIN_USER_MEMBERSHIP_STATES)[keyof typeof ADMIN_USER_MEMBERSHIP_STATES];

/** One administrator user in one company. The removal fields are null until the user is removed. */
export type AdminUser = {
  userUuid: string;
  email: string;
  companySlug: string;
  roles: AdminUserRole[];
  globalUserState: AdminUserGlobalState;
  membershipState: AdminUserMembershipState;
  createdAt: string;
  lastLoginAt: string | null;
  welcomeNotificationStatus: string;
  deletedAt: string | null;
  deletedByUserUuid: string | null;
  deleteReason: string | null;
};

export type AdminUserListResponse = { users: AdminUser[] };

/** A role a membership can carry, with its display name. */
export type AdminUserRoleDescription = { slug: AdminUserRole; name: string; description: string };

export type AdminUserRoleListResponse = { roles: AdminUserRoleDescription[] };

/** Filters for a user list. A tenant administrator always sees only its own company. */
export type AdminUserListQuery = {
  companySlug?: string;
  role?: AdminUserRole;
  globalState?: AdminUserGlobalState;
  membershipState?: AdminUserMembershipState;
  welcomeStatus?: string;
  includeEnded?: boolean;
  /** Lists removed users too. System administrators only. */
  includeDeleted?: boolean;
};

/** Narrows a single-user read or action to one company, optionally including ended memberships. */
export type AdminUserScope = { companySlug?: string; includeEnded?: boolean };

export type AdminUserCreateRequest = { companySlug: string; email: string; roles: AdminUserRole[] };

export type AdminUserUpdateRequest = { roles: AdminUserRole[] };

export type AdminUserMembershipCreateRequest = { companySlug: string; roles: AdminUserRole[] };

/** A disable. `globalUser` disables the identity rather than one membership (system administrators only). */
export type AdminUserDisableRequest = { reason?: string; companySlug?: string; globalUser?: boolean };

/** An enable. A membership reopens only with the roles it carries. */
export type AdminUserEnableRequest = { roles: AdminUserRole[]; companySlug?: string; globalUser?: boolean };

/** The reason for a soft delete or restore; it lands in the tenant's audit stream. */
export type AdminUserRemovalRequest = { reason: string };

/** The notification a reset queued, not a password: the server never returns the credential. */
export type AdminUserPasswordReset = { messageUuid: string; deliveryUuids: string[] };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type Query = Record<string, string | boolean | undefined>;

const usersPath = "/users";

export class AdminUserAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(query: AdminUserListQuery = {}, options?: RequestOptions): Promise<AdminUserListResponse> {
    const response = await this.request<{ users: AdminUser[] | null }>(
      "GET",
      withQuery(usersPath, query),
      undefined,
      options,
    );
    return { users: response.users ?? [] };
  }

  /** The roles a membership can be given. */
  async listRoles(options?: RequestOptions): Promise<AdminUserRoleListResponse> {
    const response = await this.request<{ roles: AdminUserRoleDescription[] | null }>(
      "GET",
      "/user-roles",
      undefined,
      options,
    );
    return { roles: response.roles ?? [] };
  }

  get(userUuid: string, scope: AdminUserScope = {}, options?: RequestOptions): Promise<AdminUser> {
    return this.request("GET", withQuery(userPath(userUuid), scope), undefined, options);
  }

  /** Creates a user with a membership in one company and queues the welcome notification. */
  create(body: AdminUserCreateRequest, options?: RequestOptions): Promise<AdminUser> {
    return this.request("POST", usersPath, body, options);
  }

  /** Replaces the user's roles in one company. */
  update(
    userUuid: string,
    body: AdminUserUpdateRequest,
    companySlug?: string,
    options?: RequestOptions,
  ): Promise<AdminUser> {
    return this.request("PUT", withQuery(userPath(userUuid), { companySlug }), body, options);
  }

  disable(userUuid: string, request: AdminUserDisableRequest = {}, options?: RequestOptions): Promise<void> {
    const { reason, ...query } = request;
    const body = reason === undefined ? undefined : { reason };
    return this.request("POST", withQuery(`${userPath(userUuid)}/disable`, query), body, options);
  }

  enable(userUuid: string, request: AdminUserEnableRequest, options?: RequestOptions): Promise<void> {
    const { roles, ...query } = request;
    return this.request("POST", withQuery(`${userPath(userUuid)}/enable`, query), { roles }, options);
  }

  /** Adds an existing user to another company with the given roles. */
  addMembership(
    userUuid: string,
    body: AdminUserMembershipCreateRequest,
    options?: RequestOptions,
  ): Promise<AdminUser> {
    return this.request("POST", `${userPath(userUuid)}/memberships`, body, options);
  }

  async resetPassword(
    userUuid: string,
    scope: AdminUserScope = {},
    options?: RequestOptions,
  ): Promise<AdminUserPasswordReset> {
    const path = withQuery(`${userPath(userUuid)}/reset-password`, scope);
    const reset = await this.request<{ messageUuid: string; deliveryUuids: string[] | null }>(
      "POST",
      path,
      undefined,
      options,
    );
    return { messageUuid: reset.messageUuid, deliveryUuids: reset.deliveryUuids ?? [] };
  }

  /** Removes the user's access in one company while keeping the record. */
  softDelete(
    userUuid: string,
    companySlug: string,
    body: AdminUserRemovalRequest,
    options?: RequestOptions,
  ): Promise<AdminUser> {
    return this.request("POST", withQuery(`${userPath(userUuid)}/soft-delete`, { companySlug }), body, options);
  }

  /** Reverses a soft delete in one company. */
  restore(
    userUuid: string,
    companySlug: string,
    body: AdminUserRemovalRequest,
    options?: RequestOptions,
  ): Promise<AdminUser> {
    return this.request("POST", withQuery(`${userPath(userUuid)}/restore`, { companySlug }), body, options);
  }

  /** Re-sends the welcome notification. */
  retryWelcome(userUuid: string, scope: AdminUserScope = {}, options?: RequestOptions): Promise<void> {
    return this.request("POST", withQuery(`${userPath(userUuid)}/retry-welcome`, scope), undefined, options);
  }
}

function userPath(userUuid: string): string {
  return `${usersPath}/${encodeURIComponent(userUuid)}`;
}

function withQuery(path: string, query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}
