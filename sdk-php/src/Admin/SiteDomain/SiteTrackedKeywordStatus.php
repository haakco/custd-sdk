<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTrackedKeywordStatus names the values of TrackedKeyword.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTrackedKeywordStatus
{
    public const ACTIVE = 'active';
    public const PAUSED = 'paused';
}
