<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * DashboardRelativeRange names the values of DashboardSharePolicy.relativeRanges.
 * A value Custd adds later still decodes as a plain string.
 */
final class DashboardRelativeRange
{
    public const LAST_1D = '1d';
    public const LAST_7D = '7d';
    public const LAST_14D = '14d';
    public const LAST_30D = '30d';
    public const LAST_90D = '90d';
}
