<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelInputShape names the values of Input.shape.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelInputShape
{
    public const POINT = 'point';
    public const RANGE = 'range';
    public const PROPORTION = 'proportion';
    public const SAMPLES = 'samples';
    public const BOUND = 'bound';
}
