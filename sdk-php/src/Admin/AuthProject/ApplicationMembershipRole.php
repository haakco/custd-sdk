<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ApplicationMembershipRole names the values of ApplicationMembershipChoice.role,
 * ApplicationPrincipalMembershipView.role.
 * A value Custd adds later still decodes as a plain string.
 */
final class ApplicationMembershipRole
{
    public const ADMINISTRATOR = 'administrator';
    public const MEMBER = 'member';
    public const VIEWER = 'viewer';
}
