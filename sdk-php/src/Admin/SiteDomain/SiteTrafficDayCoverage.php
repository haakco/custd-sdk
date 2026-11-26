<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTrafficDayCoverage names the values of SiteTrafficDay.coverage.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTrafficDayCoverage
{
    public const COMPLETE = 'complete';
    public const PARTIAL = 'partial';
    public const MISSING = 'missing';
}
