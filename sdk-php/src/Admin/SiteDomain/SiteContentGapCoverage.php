<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteContentGapCoverage names the values of SiteContentGap.ownCoverage.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteContentGapCoverage
{
    public const AVAILABLE = 'available';
    public const UNAVAILABLE = 'unavailable';
}
