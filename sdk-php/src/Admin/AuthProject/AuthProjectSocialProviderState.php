<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectSocialProviderState names the values of SocialProviderStatus.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectSocialProviderState
{
    public const ACTIVE = 'active';
    public const APPLYING = 'applying';
    public const UNAVAILABLE = 'unavailable';
    public const WAITING_FOR_DIRECTORY = 'waiting_for_directory';
}
