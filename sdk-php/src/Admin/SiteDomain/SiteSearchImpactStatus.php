<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteSearchImpactStatus names the values of SearchImpactPeriod.status, SiteFindingImpactSource.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteSearchImpactStatus
{
    public const MEASURED = 'measured';
    public const INSUFFICIENT = 'insufficient';
}
