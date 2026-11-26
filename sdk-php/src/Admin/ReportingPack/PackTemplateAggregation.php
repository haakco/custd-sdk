<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackTemplateAggregation names the values of PackTemplate.aggregation.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackTemplateAggregation
{
    public const COUNT = 'count';
    public const FLOW = 'flow';
    public const DISTINCT_COUNT = 'distinct_count';
    public const SUM = 'sum';
    public const AVERAGE = 'average';
    public const PERCENTILE = 'percentile';
    public const RATIO = 'ratio';
}
