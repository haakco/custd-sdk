<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

/**
 * MeasurementForecastMethod names the values of MeasurementForecastRunRequest.method,
 * ProjectUpdateRequest.forecastMethod.
 * A value Custd adds later still decodes as a plain string.
 */
final class MeasurementForecastMethod
{
    public const BOOTSTRAP_QUANTILE = 'bootstrap_quantile';
    public const BAYESIAN_LINEAR_REGRESSION = 'bayesian_linear_regression';
    public const SEASONAL_7_DAY = 'seasonal_7_day';
}
