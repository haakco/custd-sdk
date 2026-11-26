<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectIdentityMode names the values of AuthProjectCreateRequest.identityMode,
 * AuthProjectEnvironmentCreateRequest.identityMode, AuthProjectSummary.identityMode, Capability.identityModes,
 * DesiredState.identityMode.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectIdentityMode
{
    public const ISOLATED = 'isolated';
    public const SHARED = 'shared';
}
