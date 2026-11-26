<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * DataSufficiency names the values of RenderedMetricValue.dataSufficiency.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataSufficiency
{
    public const UNKNOWN = 'unknown';
    public const SUFFICIENT = 'sufficient';
    public const PARTIAL = 'partial';
    public const INSUFFICIENT = 'insufficient';
}
