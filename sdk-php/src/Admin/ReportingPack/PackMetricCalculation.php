<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackMetricCalculation names the values of PackMetric.calculation.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackMetricCalculation
{
    public const USAGE_CHARGE = 'usage_charge';
    public const MARGINAL_RATE = 'marginal_rate';
    public const PROJECTION = 'projection';
    public const PURCHASED_VS_USED = 'purchased_vs_used';
    public const OBSERVED_BALANCE = 'observed_balance';
    public const PROJECTED_BALANCE = 'projected_balance';
    public const ALLOCATED_RECOVERY = 'allocated_recovery';
    public const CORRECTION_COUNT = 'correction_count';
    public const COUNT = 'count';
    public const FAILURE_COUNT = 'failure_count';
    public const FLOW = 'flow';
    public const DISTINCT_COUNT = 'distinct_count';
    public const SUM = 'sum';
    public const AVERAGE = 'average';
    public const PERCENTILE = 'percentile';
    public const RATIO = 'ratio';
    public const LATEST = 'latest';
    public const MINIMUM = 'minimum';
    public const MAXIMUM = 'maximum';
    public const FIRST_LAST_DELTA = 'firstLastDelta';
    public const TIME_WEIGHTED_AVERAGE = 'timeWeightedAverage';
    public const RATE = 'rate';
    public const INTEGRAL = 'integral';
}
