<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelSourceKind names the values of InputSource.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelSourceKind
{
    public const COUNTER_FORECAST = 'counter_forecast';
}
