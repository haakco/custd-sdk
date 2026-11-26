<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\User\AdminUser;
use HaakCo\Custd\Admin\User\AdminUserCreateRequest;
use HaakCo\Custd\Admin\User\AdminUserDisableRequest;
use HaakCo\Custd\Admin\User\AdminUserEnableRequest;
use HaakCo\Custd\Admin\User\AdminUserListResponse;
use HaakCo\Custd\Admin\User\AdminUserMembershipCreateRequest;
use HaakCo\Custd\Admin\User\AdminUserRemovalRequest;
use HaakCo\Custd\Admin\User\AdminUserRoleListResponse;
use HaakCo\Custd\Admin\User\AdminUserUpdateRequest;
use HaakCo\Custd\Admin\User\PasswordResetResponse;

/**
 * UserClient manages a tenant's administrator users, their memberships and roles. A user has a global state and
 * a per-company membership state; a system administrator names the tenant with companySlug.
 */
final class UserClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List admin users.
     */
    public function list(?string $role = null, ?string $globalState = null, ?string $membershipState = null, ?string $welcomeStatus = null, ?bool $includeEnded = null, ?bool $includeDeleted = null, ?string $companySlug = null): AdminUserListResponse
    {
        return AdminUserListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/users', ['role' => $role, 'globalState' => $globalState, 'membershipState' => $membershipState, 'welcomeStatus' => $welcomeStatus, 'includeEnded' => $includeEnded, 'includeDeleted' => $includeDeleted, 'companySlug' => $companySlug], null));
    }

    /**
     * Get an admin user.
     */
    public function get(string $userUuid, ?bool $includeEnded = null, ?string $companySlug = null): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('GET', '/api/v1/admin/users/' . rawurlencode($userUuid), ['includeEnded' => $includeEnded, 'companySlug' => $companySlug], null));
    }

    /**
     * Create an admin user.
     */
    public function create(AdminUserCreateRequest $request): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('POST', '/api/v1/admin/users', [], $request->serialise()));
    }

    /**
     * Update an admin user.
     */
    public function update(string $userUuid, AdminUserUpdateRequest $request, ?string $companySlug = null): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('PUT', '/api/v1/admin/users/' . rawurlencode($userUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Disable an admin user.
     */
    public function disable(string $userUuid, AdminUserDisableRequest $request, ?bool $globalUser = null, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/disable', ['globalUser' => $globalUser, 'companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Enable an admin user.
     */
    public function enable(string $userUuid, AdminUserEnableRequest $request, ?bool $globalUser = null, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/enable', ['globalUser' => $globalUser, 'companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Add an existing user to a tenant.
     */
    public function addMembership(string $userUuid, AdminUserMembershipCreateRequest $request): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/memberships', [], $request->serialise()));
    }

    /**
     * Reset an admin user password.
     */
    public function resetPassword(string $userUuid, ?bool $includeEnded = null, ?string $companySlug = null): PasswordResetResponse
    {
        return PasswordResetResponse::fromPayload($this->http->object('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/reset-password', ['includeEnded' => $includeEnded, 'companySlug' => $companySlug], null));
    }

    /**
     * Restore a soft-deleted admin user.
     */
    public function restore(string $userUuid, string $companySlug, AdminUserRemovalRequest $request): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/restore', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Retry an admin user welcome notification.
     */
    public function retryWelcome(string $userUuid, ?bool $includeEnded = null, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/retry-welcome', ['includeEnded' => $includeEnded, 'companySlug' => $companySlug], null);
    }

    /**
     * Soft-delete an admin user.
     */
    public function softDelete(string $userUuid, string $companySlug, AdminUserRemovalRequest $request): AdminUser
    {
        return AdminUser::fromPayload($this->http->object('POST', '/api/v1/admin/users/' . rawurlencode($userUuid) . '/soft-delete', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * List admin user roles.
     */
    public function listRoles(): AdminUserRoleListResponse
    {
        return AdminUserRoleListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/user-roles', [], null));
    }
}
