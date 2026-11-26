<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

/**
 * AdminUserRoleSlug names the values of AdminUser.roles, AdminUserCreateRequest.roles,
 * AdminUserEnableRequest.roles, AdminUserMembershipCreateRequest.roles, AdminUserRole.slug,
 * AdminUserUpdateRequest.roles.
 * A value Custd adds later still decodes as a plain string.
 */
final class AdminUserRoleSlug
{
    public const TENANT_ADMIN = 'tenant_admin';
    public const TENANT_INGEST_MANAGER = 'tenant_ingest_manager';
    public const TENANT_ANALYST = 'tenant_analyst';
}
