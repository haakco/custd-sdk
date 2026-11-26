<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAnalyticsProvider names the values of SiteAnalyticsConnection.provider.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAnalyticsProvider
{
    public const GA4 = 'ga4';
}
