<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAnalyticsUnavailableReport names the values of SiteAnalyticsUnavailable.report.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAnalyticsUnavailableReport
{
    public const ECOMMERCE = 'ecommerce';
    public const AUDIENCE = 'audience';
}
