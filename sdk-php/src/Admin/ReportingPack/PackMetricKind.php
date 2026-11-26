<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackMetricKind names the values of PackMetric.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackMetricKind
{
    public const COUNT = 'count';
    public const UNIQUE_COUNT = 'unique_count';
    public const RATE = 'rate';
    public const LATENCY = 'latency';
    public const PERCENTILE = 'percentile';
    public const FAILURE_RATIO = 'failure_ratio';
    public const FRESHNESS_AGE = 'freshness_age';
    public const LATEST_VALUE = 'latest_value';
    public const PROBABILITY = 'probability';
    public const QUANTILE = 'quantile';
    public const CREDIBLE_INTERVAL = 'credible_interval';
    public const FORECAST_DATE = 'forecast_date';
    public const VALUE_OF_INFORMATION = 'value_of_information';
}
