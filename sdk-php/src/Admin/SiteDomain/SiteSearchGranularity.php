<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteSearchGranularity names the values of SearchSource.granularity, SiteFindingImpactSource.granularity.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteSearchGranularity
{
    public const DAILY = 'daily';
    public const WEEKLY = 'weekly';
}
