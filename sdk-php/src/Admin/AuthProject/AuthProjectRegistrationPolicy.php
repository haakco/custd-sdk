<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectRegistrationPolicy names the values of Capability.registrationPolicies,
 * DesiredState.registrationPolicy.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectRegistrationPolicy
{
    public const INVITE_ONLY = 'invite_only';
    public const OPEN = 'open';
}
