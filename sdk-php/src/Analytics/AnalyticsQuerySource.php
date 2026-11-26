<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

/**
 * AnalyticsQuerySource names the values of AnalyticsEventsQueryRequest.source, AnalyticsRangeQueryRequest.source,
 * RangeBucket.source, SourceSummary.name.
 * A value Custd adds later still decodes as a plain string.
 */
final class AnalyticsQuerySource
{
    public const AUTO = 'auto';
    public const POSTGRES = 'postgres';
    public const DUCKDB = 'duckdb';
    public const ROLLUP = 'rollup';
    public const MATERIALIZED = 'materialized';
}
