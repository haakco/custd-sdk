<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * WidgetKind names the values of WidgetDefinition.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class WidgetKind
{
    public const STAT_TILE = 'stat_tile';
    public const TIME_SERIES = 'time_series';
    public const BREAKDOWN_TABLE = 'breakdown_table';
    public const TOP_LIST = 'top_list';
    public const HEALTH_LIST = 'health_list';
    public const FRESHNESS_PANEL = 'freshness_panel';
    public const EXPORT_TABLE = 'export_table';
    public const LIFECYCLE_FUNNEL = 'lifecycle_funnel';
    public const COHORT_RETENTION = 'cohort_retention';
    public const FORECAST_FAN = 'forecast_fan';
    public const UNCERTAINTY_BAND = 'uncertainty_band';
    public const PROBABILITY_TILE = 'probability_tile';
    public const DISTRIBUTION_HISTOGRAM = 'distribution_histogram';
    public const VOI_RANKED_LIST = 'voi_ranked_list';
    public const CALIBRATION_PANEL = 'calibration_panel';
    public const RUNWAY_TILE = 'runway_tile';
    public const ANOMALY_TIMELINE = 'anomaly_timeline';
    public const DRIVER_BREAKDOWN = 'driver_breakdown';
}
