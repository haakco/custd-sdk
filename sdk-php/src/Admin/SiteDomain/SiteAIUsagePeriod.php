<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAIUsagePeriod names the values of SiteAITenantUsage.period.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAIUsagePeriod
{
    public const DAY = 'day';
    public const MONTH = 'month';
    public const PREVIOUS_MONTH = 'previous-month';
}
