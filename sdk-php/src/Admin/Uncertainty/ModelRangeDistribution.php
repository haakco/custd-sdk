<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelRangeDistribution names the values of Input.distribution.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelRangeDistribution
{
    public const NORMAL = 'normal';
    public const LOGNORMAL = 'lognormal';
    public const UNIFORM = 'uniform';
}
