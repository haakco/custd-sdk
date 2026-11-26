<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

/**
 * DurationForecastMethod names the values of DurationForecastDefinition.method,
 * DurationForecastEvaluationMetric.method.
 * A value Custd adds later still decodes as a plain string.
 */
final class DurationForecastMethod
{
    public const NOMINAL = 'nominal';
    public const DURATION_SHRINKAGE = 'duration_shrinkage';
}
