<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectSocialProviderMode names the values of SocialProvider.mode, SocialProviderStatus.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectSocialProviderMode
{
    public const SHARED = 'shared';
    public const OWN = 'own';
}
