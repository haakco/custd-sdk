<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

/**
 * AdminUserGlobalState names the values of AdminUser.globalUserState.
 * A value Custd adds later still decodes as a plain string.
 */
final class AdminUserGlobalState
{
    public const ENABLED = 'enabled';
    public const SUSPENDED = 'suspended';
}
