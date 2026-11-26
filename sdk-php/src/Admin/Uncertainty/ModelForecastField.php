<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelForecastField names the values of InputSource.field.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelForecastField
{
    public const COMPLETION_DAYS = 'completion_days';
    public const DEADLINE_PROBABILITY = 'deadline_probability';
    public const RATE_PER_DAY = 'rate_per_day';
}
