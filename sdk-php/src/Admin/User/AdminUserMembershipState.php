<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

/**
 * AdminUserMembershipState names the values of AdminUser.membershipState.
 * A value Custd adds later still decodes as a plain string.
 */
final class AdminUserMembershipState
{
    public const ACTIVE = 'active';
    public const ENDED = 'ended';
}
