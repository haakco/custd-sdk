<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAIMode names the values of SiteAISettings.aiMode, SiteAISettingsRequest.aiMode, SiteAITenantUsage.aiMode,
 * SiteNextActions.aiMode.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAIMode
{
    public const OFF = 'off';
    public const PLATFORM = 'platform';
    public const OWN_KEY = 'own-key';
}
