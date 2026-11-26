<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteFindingImpactStatus names the values of SiteFindingImpact.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteFindingImpactStatus
{
    public const OPEN = 'open';
    public const MEASURED = 'measured';
    public const INSUFFICIENT = 'insufficient';
}
