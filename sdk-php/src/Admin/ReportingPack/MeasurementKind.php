<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * MeasurementKind names the values of PackMetric.measurementKind, SemanticSeries.measurementKind.
 * A value Custd adds later still decodes as a plain string.
 */
final class MeasurementKind
{
    public const GAUGE = 'gauge';
    public const MONOTONIC_COUNTER = 'monotonicCounter';
    public const INTERVAL_INCREMENT = 'intervalIncrement';
    public const STATE = 'state';
}
