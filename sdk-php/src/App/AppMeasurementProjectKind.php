<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppMeasurementProjectKind names the values of AppMeasurementProjectCreate.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppMeasurementProjectKind
{
    public const DEADLINE_FORECAST = 'deadline_forecast';
    public const RUNWAY_FORECAST = 'runway_forecast';
}
