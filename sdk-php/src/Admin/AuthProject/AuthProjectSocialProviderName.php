<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectSocialProviderName names the values of SocialCallbackURL.provider, SocialProvider.provider,
 * SocialProviderStatus.provider.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectSocialProviderName
{
    public const GOOGLE = 'google';
    public const GITHUB = 'github';
}
